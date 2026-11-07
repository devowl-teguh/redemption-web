export const ErrorCode = {
  CODE_NOT_FOUND: 'CODE_NOT_FOUND',
  CODE_EXPIRED: 'CODE_EXPIRED',
  CODE_INACTIVE: 'CODE_INACTIVE',
  CODE_ALREADY_USED: 'CODE_ALREADY_USED',
  ALREADY_REDEEMED_BY_YOU: 'ALREADY_REDEEMED_BY_YOU',
  RATE_LIMITED: 'RATE_LIMITED',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  REQUEST_IN_PROGRESS: 'REQUEST_IN_PROGRESS',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
export interface ApiError { code: ErrorCode; message: string }
export interface LoginRequest { email: string; password: string }
export interface MemberDto { id: string; name: string; email: string }
export interface RewardDto { id: string; name: string; description: string }
export interface RedeemRequest { code: string }
export interface RedemptionDto {
  id: string;
  code: string;
  reward: RewardDto;
  createdAt: string;
}
export interface RedemptionHistoryResponse {
  items: RedemptionDto[];
  nextCursor: string | null;
}
