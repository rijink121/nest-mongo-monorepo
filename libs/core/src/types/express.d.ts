import { OwnerDto } from '@core/types/owner';

declare global {
  namespace Express {
    interface Request {
      user?: OwnerDto;
    }
  }
}
