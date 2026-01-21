import { OWNER_INCLUDE_ATTRIBUTES_KEY } from '@core/decorators/owner-attributes.decorator';
import { OWNER_INCLUDE_POPULATES_KEY } from '@core/decorators/owner-populates.decorator';
import { IS_PUBLIC_KEY } from '@core/decorators/public.decorator';
import { OwnerDto } from '@core/types/owner';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    request[OWNER_INCLUDE_ATTRIBUTES_KEY] = this.reflector.getAllAndOverride<
      string[]
    >(OWNER_INCLUDE_ATTRIBUTES_KEY, [context.getHandler(), context.getClass()]);
    request[OWNER_INCLUDE_POPULATES_KEY] = this.reflector.getAllAndOverride<
      string[]
    >(OWNER_INCLUDE_POPULATES_KEY, [context.getHandler(), context.getClass()]);
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: Error | null, user: OwnerDto): TUser {
    if (err) {
      throw err;
    }
    if (!user || !user.userId) {
      throw new UnauthorizedException();
    }
    return user as TUser;
  }
}
