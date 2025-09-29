import { OwnerDto } from '@core/types/owner';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Extended Express Request interface that includes authenticated user information.
 *
 * This interface adds the optional `user` property to the standard Express Request,
 * which is typically populated by authentication middleware (JWT guards, Passport strategies, etc.).
 *
 * @interface AuthRequest
 * @extends Request
 */
export interface AuthRequest extends Request {
  /**
   * The authenticated user/owner object attached to the request.
   * This property is set by authentication middleware and contains user details.
   */
  user?: OwnerDto;
}

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
    const request: AuthRequest = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
