import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

/**
 * User-specific cache interceptor that generates cache keys including authenticated user ID.
 *
 * This interceptor extends the standard NestJS CacheInterceptor to provide user isolation
 * by appending the user's unique identifier to cache keys. This ensures that each
 * authenticated user gets their own cached responses, preventing data leakage between users.
 *
 * Key Generation Strategy:
 * - For authenticated requests: `{base_key}:{user_id}`
 * - For unauthenticated requests: `{base_key}` (falls back to standard behavior)
 *
 * @example Usage in Cache decorator
 * ```typescript
 * @Get('profile')
 * @Cache({ perUser: true })
 * async getUserProfile() {
 *   // Each user gets their own cached profile data
 *   return this.userService.getProfile();
 * }
 * ```
 *
 * Security Benefits:
 * - Prevents cross-user data contamination
 * - Maintains user privacy in cached responses
 * - Enables safe caching of user-specific data
 */
@Injectable()
export class UserCacheInterceptor extends CacheInterceptor {
  /**
   * Generates a user-specific cache key by appending the user ID to the base key.
   *
   * @param context - NestJS execution context containing HTTP request information
   * @returns Cache key string with user ID appended, or undefined if base key generation fails
   */
  trackBy(context: ExecutionContext): string | undefined {
    // Get the authenticated request object
    const request: Request = context.switchToHttp().getRequest();

    // Generate the base cache key using parent interceptor logic
    const baseKey = super.trackBy(context);

    // Return undefined if base key generation failed
    if (!baseKey) return undefined;

    // Append user ID for authenticated requests to ensure user isolation
    if (request.user?.id) {
      return `${baseKey}:user:${request.user.id}`;
    }

    // Fall back to base key for unauthenticated requests
    return baseKey;
  }
}
