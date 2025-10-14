import { OwnerDto } from '@core/types/owner';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../../user/user.service';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: Pick<OwnerDto, 'userId'>) {
    console.log('JWT Payload:', payload);
    const { error, data } = await this.userService.$db.findRecordById({
      id: payload.userId,
      options: {
        allowEmpty: true,
      },
    });
    if (!!error || !data || !data.active) {
      throw new UnauthorizedException();
    }
    return { ...data.toJSON(), ...payload };
  }
}
