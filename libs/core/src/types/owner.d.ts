// core/types/owner.d.ts
export interface OwnerDto {
  id: string;
  sessionId: string;
  userId: string;
  iat: number;
  exp: number;
  info?: Record<string, unknown>;
}
