import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// Seed is a maintenance task; prefer the session pooler when configured.
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
});
const members = [
  ['Alex Lee', 'alex@perk.demo'],
  ['Mia Chen', 'mia@perk.demo'],
  ['Noah Williams', 'noah@perk.demo'],
  ['Emma Wilson', 'emma@perk.demo'],
  ['Liam Davis', 'liam@perk.demo'],
] as const;
const rewards = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'A coffee, on us', description: 'One barista-made coffee.' },
  { id: '00000000-0000-4000-8000-000000000002', name: '$25 shopping credit', description: 'Credit toward something you love.' },
  { id: '00000000-0000-4000-8000-000000000003', name: 'One month of music', description: 'Thirty days of music membership.' },
] as const;

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production.');
  const password = process.env.SEED_MEMBER_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('Set SEED_MEMBER_PASSWORD to a development-only password of at least 12 characters.');
  }
  const passwordHash = await hash(password, 12);
  await prisma.$transaction(async (tx) => {
    for (const [name, email] of members) {
      // Re-running preserves existing credentials and redemption records.
      await tx.member.upsert({ where: { email }, update: {}, create: { name, email, passwordHash } });
    }
    for (const reward of rewards) {
      await tx.reward.upsert({ where: { id: reward.id }, update: {}, create: reward });
    }
    const codes = [
      { code: 'COFFEE-ON-US', rewardId: rewards[0].id, maxUses: 5 },
      { code: 'LITTLE-EXTRA', rewardId: rewards[1].id, maxUses: 1 },
      { code: 'PLAY-IT-LOUD', rewardId: rewards[2].id, maxUses: 3 },
      { code: 'TOO-LATE', rewardId: rewards[0].id, maxUses: 1, expiresAt: new Date('2020-01-01T00:00:00.000Z') },
      { code: 'NOT-YET', rewardId: rewards[1].id, maxUses: 1, isActive: false },
      { code: 'FUTURE-PERK', rewardId: rewards[0].id, maxUses: 1, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    ];
    for (const code of codes) {
      // Never reset usedCount or reactivate previously consumed codes.
      await tx.redemptionCode.upsert({ where: { code: code.code }, update: {}, create: code });
    }
  }, {
    // Remote seed upserts can exceed Prisma's 5-second interactive default.
    // Keep this budget local to seeding, not normal API transactions.
    maxWait: 10_000,
    timeout: 60_000,
  });
  console.info('Seed complete: 5 demo members, 3 rewards, 6 codes. Existing records preserved.');
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
