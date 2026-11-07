import 'dotenv/config';
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

const db = new PrismaClient();
after(async () => { await db.$disconnect(); });
const rollback = new Error('test rollback');

async function rolledBack(action: (tx: Prisma.TransactionClient) => Promise<void>) {
  try {
    await db.$transaction(async (tx) => { await action(tx); throw rollback; });
  } catch (error) { if (error !== rollback) throw error; }
}

test('seed fixtures contain hashed credentials and all planned code states', async () => {
  const members = await db.member.findMany({ where: { email: { endsWith: '@perk.demo' } } });
  assert.equal(members.length, 5);
  assert.ok(process.env.SEED_MEMBER_PASSWORD);
  for (const member of members) assert.ok(await compare(process.env.SEED_MEMBER_PASSWORD!, member.passwordHash));
  const codes = await db.redemptionCode.findMany();
  assert.ok(codes.some((c) => c.maxUses === 1 && c.isActive && !c.expiresAt));
  assert.ok(codes.some((c) => c.maxUses === 3));
  assert.ok(codes.some((c) => c.expiresAt && c.expiresAt < new Date()));
  assert.ok(codes.some((c) => !c.isActive));
});

test('all application tables enable RLS and grant no policies', async () => {
  const rows = await db.$queryRaw<Array<{ relname: string; relrowsecurity: boolean }>>`
    SELECT relname, relrowsecurity FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
    AND relname IN ('Member', 'Reward', 'RedemptionCode', 'Redemption')`;
  assert.equal(rows.length, 4);
  assert.ok(rows.every((r) => r.relrowsecurity));
  const policies = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT count(*) FROM pg_policies WHERE schemaname = 'public'
    AND tablename IN ('Member', 'Reward', 'RedemptionCode', 'Redemption')`;
  assert.equal(policies[0].count, 0n);
});

test('RLS hides rows and blocks writes for an untrusted role', async () => {
  // Disposable local PostgreSQL only: this role and its grants roll back.
  await rolledBack(async (tx) => {
    await tx.$executeRawUnsafe('CREATE ROLE redemption_rls_test NOLOGIN');
    await tx.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO redemption_rls_test');
    await tx.$executeRawUnsafe('GRANT SELECT, INSERT ON "Member" TO redemption_rls_test');
    await tx.$executeRawUnsafe('SET LOCAL ROLE redemption_rls_test');
    const visible = await tx.$queryRaw<Array<{ count: bigint }>>`SELECT count(*) FROM "Member"`;
    assert.equal(visible[0].count, 0n);
    await tx.$executeRawUnsafe('RESET ROLE');
  });
  await assert.rejects(rolledBack(async (tx) => {
    await tx.$executeRawUnsafe('CREATE ROLE redemption_rls_test NOLOGIN');
    await tx.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO redemption_rls_test');
    await tx.$executeRawUnsafe('GRANT SELECT, INSERT ON "Member" TO redemption_rls_test');
    await tx.$executeRawUnsafe('SET LOCAL ROLE redemption_rls_test');
    await tx.member.create({ data: { name: 'Denied', email: 'denied@local.test', passwordHash: 'unused' } });
  }), /row-level security/);
});

test('database rejects invalid code counters', async () => {
  const reward = await db.reward.findFirstOrThrow();
  for (const values of [{ maxUses: 0, usedCount: 0 }, { maxUses: 1, usedCount: -1 }, { maxUses: 1, usedCount: 2 }]) {
    await assert.rejects(rolledBack(async (tx) => {
      await tx.redemptionCode.create({ data: { code: randomUUID(), rewardId: reward.id, ...values } });
    }), /check constraint/);
  }
});

test('database enforces member/code and member/idempotency uniqueness', async () => {
  const member = await db.member.findFirstOrThrow();
  const code = await db.redemptionCode.findUniqueOrThrow({ where: { code: 'COFFEE-ON-US' } });
  const other = await db.redemptionCode.findUniqueOrThrow({ where: { code: 'LITTLE-EXTRA' } });
  for (const repeatCode of [true, false]) {
    await assert.rejects(rolledBack(async (tx) => {
      const key = randomUUID();
      await tx.redemption.create({ data: { memberId: member.id, codeId: code.id, rewardId: code.rewardId, idempotencyKey: key } });
      await tx.redemption.create({ data: { memberId: member.id, codeId: repeatCode ? code.id : other.id, rewardId: repeatCode ? code.rewardId : other.rewardId, idempotencyKey: repeatCode ? randomUUID() : key } });
    }), /Unique constraint/);
  }
});
