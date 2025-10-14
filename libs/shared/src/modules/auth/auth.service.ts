import { OwnerDto } from '@core/types/owner';
import { JobResponse } from '@core/utils/job';
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { SessionService } from '../session/session.service';
import { SessionData } from './definitions/session';

@Injectable()
export class AuthService {
  constructor(private readonly sessionService: SessionService) {}

  async createSession(
    owner: OwnerDto,
    info: Record<string, unknown>,
  ): Promise<JobResponse<SessionData>> {
    try {
      const refreshToken = randomBytes(40).toString('hex');
      const { error, data } = await this.sessionService.create({
        action: 'create',
        owner,
        body: {
          token: refreshToken,
          token_expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          user_id: owner.userId,
          info,
        },
      });
      if (error || !data) return { error };
      const { data: tokenData, error: tokenError } =
        this.sessionService.createToken({
          sessionId: data._id.toString(),
          userId: owner.id,
        });
      if (tokenError || !tokenData) {
        return { error: tokenError };
      }
      return {
        error: false,
        data: {
          token: tokenData.token,
          token_expiry: tokenData.tokenExpiry,
          refresh_token: refreshToken,
          user: owner,
          session_id: data._id.toString(),
        },
      };
    } catch (error) {
      return { error };
    }
  }
}
