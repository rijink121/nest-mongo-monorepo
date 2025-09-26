import '@core/types/owner';

declare module '@core/types/owner' {
  interface OwnerDto {
    email?: string;
    role?: 'admin' | 'user';
  }
}
