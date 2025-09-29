import { OwnerDto } from '@core/types/owner';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Decorator for fetching user from Request object
 *
 * user object will be available for controller's methods as a parameter
 *```js
 * @User() user: any
 * ```
 * @return {object} user - req.user object
 */
export const Owner = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): OwnerDto | undefined => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
