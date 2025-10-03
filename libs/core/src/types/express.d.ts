import { OwnerDto } from '@core/types/owner';

declare global {
  namespace Express {
    interface User extends OwnerDto {
      userId: string;
    }
  }
}
