import { OwnerDto } from '@core/types/owner';
import { Moment } from 'moment-timezone';

export class SessionData {
  session_id: string;
  token: string;
  token_expiry: Moment;
  refresh_token: string;
  user: Partial<OwnerDto>;
}
