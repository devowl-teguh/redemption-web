import type { ApiError, LoginRequest, MemberDto, RedemptionDto, RedemptionHistoryResponse } from '@redemption/types';

export class RequestError extends Error {
  constructor(public code: string, message: string, public status = 0) { super(message); }
}
export const messages: Record<string, string> = {
  CODE_NOT_FOUND: 'We couldn’t find that code. Check the spelling and try again.',
  CODE_EXPIRED: 'This code has expired. There’s another good thing around the corner.',
  CODE_INACTIVE: 'This code isn’t active yet. Come back when it’s ready.',
  CODE_ALREADY_USED: 'This code has been fully claimed. Try a different one.',
  ALREADY_REDEEMED_BY_YOU: 'You’ve already unwrapped this one. Find it in your history.',
  RATE_LIMITED: 'A little breather. Please wait a minute before trying again.',
  REQUEST_IN_PROGRESS: 'Your reward is still being processed. Retry in a moment.',
  IDEMPOTENCY_KEY_REQUIRED: 'We couldn’t identify this attempt. Refresh and try again.',
  UNAUTHORIZED: 'Your session has ended. Please sign in again.',
  NETWORK_ERROR: 'We couldn’t reach the server. Check your connection and retry.',
};
export function errorMessage(error: unknown) {
  return error instanceof RequestError ? (messages[error.code] ?? error.message) : 'Something went wrong. Please try again.';
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...init.headers }, signal: AbortSignal.timeout(15_000) });
  } catch { throw new RequestError('NETWORK_ERROR', messages.NETWORK_ERROR); }
  if (!response.ok) {
    const body: Partial<ApiError> = await response.json().catch(() => ({}));
    const code = response.status === 401 ? 'UNAUTHORIZED' : response.status === 429 ? 'RATE_LIMITED' : body.code ?? 'SERVER_ERROR';
    if (response.status === 401) window.dispatchEvent(new Event('perk:unauthorized'));
    throw new RequestError(code, body.message ?? 'The server couldn’t complete this request. Please try again.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const api = {
  login: (data: LoginRequest) => request<{ member: MemberDto }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  redeem: (code: string, key: string) => request<RedemptionDto>('/redemptions', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify({ code }) }),
  history: (cursor: string | null) => request<RedemptionHistoryResponse>(`/redemptions/me?limit=6${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
};
