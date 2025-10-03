import { OwnerDto } from '@core/types/owner';

export class SessionData {
  session_id: string;
  token: string;
  token_expiry: moment.Moment;
  refresh_token: string;
  user: OwnerDto;
}
