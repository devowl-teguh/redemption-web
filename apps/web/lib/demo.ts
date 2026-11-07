import type { MemberDto, RedemptionDto, RedemptionHistoryResponse } from '@redemption/types';
import { RequestError } from './api';

export const demoMembers = [
  { id: 'alex', name: 'Alex Lee', email: 'alex@perk.demo' },
  { id: 'mia', name: 'Mia Chen', email: 'mia@perk.demo' },
  { id: 'noah', name: 'Noah Williams', email: 'noah@perk.demo' },
  { id: 'emma', name: 'Emma Wilson', email: 'emma@perk.demo' },
  { id: 'liam', name: 'Liam Davis', email: 'liam@perk.demo' },
];
export const rewardList = [
  { id: 'coffee', name: 'A coffee, on us', description: 'One barista-made coffee. Your next pick-me-up is covered.', category: 'YOUR DAILY PICK-ME-UP', art: 'coffee' },
  { id: 'shopping', name: '$25 shopping credit', description: 'Put a little extra toward something you love.', category: 'SOMETHING JUST FOR YOU', art: 'shopping' },
  { id: 'music', name: 'One month of music', description: 'Thirty days of your favorite soundtrack.', category: 'MORE OF WHAT YOU LOVE', art: 'music' },
];
export const demoCodes = [
  { code: 'COFFEE-ON-US', reward: 0, max: 5, label: 'Coffee · 5 uses' },
  { code: 'LITTLE-EXTRA', reward: 1, max: 1, label: 'Shopping credit · single use' },
  { code: 'PLAY-IT-LOUD', reward: 2, max: 3, label: 'Music · 3 uses' },
  { code: 'TOO-LATE', reward: 0, max: 1, label: 'Expired code', error: 'CODE_EXPIRED' },
  { code: 'NOT-YET', reward: 1, max: 1, label: 'Inactive code', error: 'CODE_INACTIVE' },
];
type RecordEntry = RedemptionDto & { memberId: string; key: string };
const storageKey = 'perk-demo-v2';
function read(): RecordEntry[] { try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]'); } catch { throw new RequestError('STORAGE_ERROR', 'Browser storage is unavailable. Allow site storage and try again.'); } }
const delay = () => new Promise(resolve => setTimeout(resolve, 450));
export async function demoLogin(email: string, password: string): Promise<MemberDto> {
  await delay();
  const member = demoMembers.find(m => m.email === email.trim().toLowerCase());
  if (!member || password !== 'perk1234') throw new RequestError('INVALID_CREDENTIALS', 'Those details don’t match. Use a demo account and password perk1234.');
  return member;
}
export async function demoRedeem(memberId: string, code: string, key: string): Promise<RedemptionDto> {
  await delay();
  const claim = () => {
    const all = read();
    const prior = all.find(r => r.memberId === memberId && r.key === key);
    if (prior) return prior;
    const attemptKey = `perk-attempts:${memberId}`;
    const attempts: number[] = JSON.parse(sessionStorage.getItem(attemptKey) ?? '[]');
    const recent = attempts.filter(t => Date.now() - t < 60_000);
    if (recent.length >= 5) throw new RequestError('RATE_LIMITED', '');
    sessionStorage.setItem(attemptKey, JSON.stringify([...recent, Date.now()]));
    const fixture = demoCodes.find(c => c.code === code);
    if (!fixture) throw new RequestError('CODE_NOT_FOUND', '');
    if (fixture.error) throw new RequestError(fixture.error, '');
    if (all.some(r => r.memberId === memberId && r.code === code)) throw new RequestError('ALREADY_REDEEMED_BY_YOU', '');
    if (all.filter(r => r.code === code).length >= fixture.max) throw new RequestError('CODE_ALREADY_USED', '');
    const record = { id: crypto.randomUUID(), memberId, key, code, reward: rewardList[fixture.reward], createdAt: new Date().toISOString() };
    try { localStorage.setItem(storageKey, JSON.stringify([...all, record])); } catch { throw new RequestError('STORAGE_ERROR', 'Your reward could not be saved. Allow browser storage and try again.'); }
    return record;
  };
  return navigator.locks ? navigator.locks.request('perk-demo-redemption', claim) : claim();
}
export async function demoHistory(memberId: string, cursor: string | null): Promise<RedemptionHistoryResponse> {
  await delay();
  const all = read().filter(r => r.memberId === memberId).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  const offset = cursor ? all.findIndex(r => r.id === cursor) + 1 : 0;
  const items = all.slice(offset, offset + 6);
  return { items, nextCursor: offset + 6 < all.length ? items.at(-1)!.id : null };
}
export function resetDemo() { localStorage.removeItem(storageKey); for (const member of demoMembers) sessionStorage.removeItem(`perk-attempts:${member.id}`); }
