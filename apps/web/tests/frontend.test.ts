import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { api, RequestError } from '../lib/api';
import { demoHistory, demoLogin, demoRedeem } from '../lib/demo';
function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage() });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage() });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
});
test('demo accepts known members and rejects incorrect credentials', async () => {
  assert.equal((await demoLogin('alex@perk.demo', 'perk1234')).id, 'alex');
  await assert.rejects(demoLogin('alex@perk.demo', 'wrong'), { code: 'INVALID_CREDENTIALS' });
});
test('a retry with the same key returns the same reward; a new attempt cannot redeem twice', async () => {
  const first = await demoRedeem('alex', 'COFFEE-ON-US', 'attempt-1');
  const retry = await demoRedeem('alex', 'COFFEE-ON-US', 'attempt-1');
  assert.equal(first.id, retry.id);
  await assert.rejects(demoRedeem('alex', 'COFFEE-ON-US', 'attempt-2'), { code: 'ALREADY_REDEEMED_BY_YOU' });
  assert.equal((await demoHistory('alex', null)).items.length, 1);
  assert.equal((await demoHistory('mia', null)).items.length, 0);
});
test('single-use limits and invalid code states return typed failures', async () => {
  await demoRedeem('alex', 'LITTLE-EXTRA', 'single');
  await assert.rejects(demoRedeem('mia', 'LITTLE-EXTRA', 'used'), { code: 'CODE_ALREADY_USED' });
  await assert.rejects(demoRedeem('mia', 'TOO-LATE', 'expired'), { code: 'CODE_EXPIRED' });
  await assert.rejects(demoRedeem('mia', 'NOT-YET', 'inactive'), { code: 'CODE_INACTIVE' });
  await assert.rejects(demoRedeem('mia', 'UNKNOWN', 'missing'), { code: 'CODE_NOT_FOUND' });
});
test('five failed attempts trigger the demo rate limit', async () => {
  for (let i = 0; i < 5; i++) await assert.rejects(demoRedeem('alex', 'UNKNOWN', `bad-${i}`), { code: 'CODE_NOT_FOUND' });
  await assert.rejects(demoRedeem('alex', 'COFFEE-ON-US', 'sixth'), { code: 'RATE_LIMITED' });
});
test('history cursor pages remain member-specific and newest first', async () => {
  const entries = Array.from({ length: 8 }, (_, i) => ({ id: `r${i}`, memberId: 'alex', code: `CODE-${i}`, key: `key-${i}`, reward: { id: 'r', name: 'Reward', description: '' }, createdAt: new Date(2026, 0, i + 1).toISOString() }));
  localStorage.setItem('perk-demo-v2', JSON.stringify(entries));
  const first = await demoHistory('alex', null);
  assert.equal(first.items.length, 6); assert.equal(first.items[0].id, 'r7');
  const second = await demoHistory('alex', first.nextCursor);
  assert.deepEqual(second.items.map(x => x.id), ['r1', 'r0']); assert.equal(second.nextCursor, null);
});
test('API client sends cookie credentials and preserves the supplied idempotency key', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, '/api/redemptions'); assert.equal(options?.credentials, 'include');
      assert.equal((options?.headers as Record<string, string>)['Idempotency-Key'], 'stable-key');
      assert.deepEqual(JSON.parse(options?.body as string), { code: 'TEST-CODE' });
      return Response.json({ id: 'success' });
    };
    assert.equal((await api.redeem('TEST-CODE', 'stable-key')).id, 'success');
  } finally { globalThis.fetch = original; }
});
test('API 401 emits session expiry and network errors remain retryable', async () => {
  const original = globalThis.fetch; let expired = false;
  window.addEventListener('perk:unauthorized', () => { expired = true; });
  try {
    globalThis.fetch = async () => Response.json({}, { status: 401 });
    await assert.rejects(api.history(null), { code: 'UNAUTHORIZED' }); assert.ok(expired);
    globalThis.fetch = async () => { throw new TypeError('offline'); };
    await assert.rejects(api.redeem('TEST-CODE', 'key'), (e: unknown) => e instanceof RequestError && e.code === 'NETWORK_ERROR');
  } finally { globalThis.fetch = original; }
});
