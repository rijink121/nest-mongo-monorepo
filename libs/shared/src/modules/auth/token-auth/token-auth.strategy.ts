import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Session } from '@shared/modules/session/entities/session.entity';
import { SessionService } from '@shared/modules/session/session.service';
import { UserService } from '@shared/modules/user/user.service';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

@Injectable()
export class TokenAuthStrategy extends PassportStrategy(Strategy, 'authtoken') {
  constructor(
    private sessionService: SessionService,
    private userService: UserService,
  ) {
    super();
  }

  async validate(
    req: Request<any, any, { refresh_token?: string }>,
  ): Promise<Session> {
    const refreshToken = req.body?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException();
    const { error, data } = await this.sessionService.$db.findOneRecord({
      options: {
        where: {
          token: refreshToken,
          token_expiry: { $gt: Date.now() },
          active: true,
        },
      },
    });
    if (error) throw new InternalServerErrorException();
    if (!data) throw new UnauthorizedException();

    const { error: userError, data: userData } =
      await this.userService.$db.findRecordById({
        id: data.user_id,
        options: {
          allowEmpty: true,
        },
      });
    if (userError) throw new InternalServerErrorException();
    if (!userData || !userData.active) throw new UnauthorizedException();

    // Return the validated session
    return data.toJSON();
  }
}
