import { JobResponse } from '@core/utils/job';
import { Injectable } from '@nestjs/common';
import { Session } from '@shared/modules/session/entities/session.entity';
import { SessionService } from '@shared/modules/session/session.service';
import { JwtPayload } from '../jwt-auth/jwt-auth.strategy';
import { TokenAuthDto } from './token-auth.dto';

@Injectable()
export class TokenAuthService {
  constructor(private readonly sessionService: SessionService) {}

  async getNewToken(
    tokens: TokenAuthDto,
    session: Session,
  ): Promise<JobResponse> {
    try {
      const { data: decodedData, error } =
        await this.sessionService.decodeToken<JwtPayload>(tokens.token);
      if (error) {
        return { error };
      }
      if (!decodedData || !decodedData.payload) {
        return { error: 'Invalid token' };
      }

      const { sessionId, userId } = decodedData.payload;
      if (sessionId !== session._id.toString() || userId !== session.user_id) {
        return { error: 'Invalid token' };
      }

      const { data: tokenData, error: tokenError } =
        await this.sessionService.createToken<JwtPayload>({
          sessionId,
          userId,
        });
      if (tokenError) {
        return { error: tokenError };
      }

      if (!tokenData) {
        return { error: 'Token generation failed' };
      }

      return {
        error: false,
        data: { token: tokenData.token, token_expiry: tokenData.tokenExpiry },
      };
    } catch (error) {
      return { error };
    }
  }
}
