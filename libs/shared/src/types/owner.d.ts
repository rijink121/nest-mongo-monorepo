import '@core/types/owner';
import { Role } from '@shared/definitions/role.enum';

declare module '@core/types/owner' {
  interface OwnerDto {
    email?: string;
    role_id?: Role;
  }
}
