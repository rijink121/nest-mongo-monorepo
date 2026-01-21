import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { BaseCacheInterceptor } from './base-cache.interceptor';

/**
 * Role-based cache interceptor that generates cache keys including user role information.
 *
 * This interceptor extends the standard NestJS CacheInterceptor to provide role-based
 * cache sharing. Users with the same role will share cached responses, which is useful
 * for scenarios where data is role-specific but doesn't vary between individual users
 * of the same role.
 *
 * Key Generation Strategy:
 * - For authenticated requests: `{base_key}:{user_role}`
 * - For unauthenticated requests: `{base_key}` (falls back to standard behavior)
 *
 * @example Usage in Cache decorator
 * ```typescript
 * @Get('dashboard')
 * @Cache({ perRole: true })
 * async getDashboard() {
 *   // All admin users share the same cached dashboard data
 *   // All regular users share their own cached dashboard data
 *   return this.dashboardService.getRoleDashboard();
 * }
 * ```
 *
 * Use Cases:
 * - Role-based dashboard data
 * - Permission-specific menu structures
 * - Role-dependent configuration data
 * - Access control lists per role
 *
 * Performance Benefits:
 * - Reduces cache memory usage compared to per-user caching
 * - Improves cache hit rates for users with same role
 * - Efficient for role-based access control scenarios
 */
@Injectable()
export class RoleCacheInterceptor extends BaseCacheInterceptor {
  /**
   * Generates a role-specific cache key by appending the user role to the base key.
   *
   * @param context - NestJS execution context containing HTTP request information
   * @returns Cache key string with user role appended, or undefined if base key generation fails
   */
  trackBy(context: ExecutionContext): string | undefined {
    // Get the authenticated request object
    const request: Request = context.switchToHttp().getRequest();

    // Generate the base cache key using parent interceptor logic
    let baseKey = super.trackBy(context);

    // Return undefined if base key generation failed
    if (!baseKey) return undefined;

    // Append user role for authenticated requests to enable role-based sharing
    if (request.user?.role_id) {
      baseKey = `${baseKey}:role:${request.user.role_id}`;
    }

    void super.setKeyTag(context, baseKey);
    // Fall back to base key for unauthenticated requests
    return baseKey;
  }
}
