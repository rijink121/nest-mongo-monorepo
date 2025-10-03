import { RoleCacheInterceptor } from '@core/interceptors/role-cache.interceptor';
import { UserCacheInterceptor } from '@core/interceptors/user-cache.interceptor';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { applyDecorators, UseInterceptors } from '@nestjs/common';

/**
 * Configuration options for the Cache decorator.
 *
 * Defines various caching strategies and parameters for fine-grained cache control.
 */
export interface CacheOptions {
  /**
   * Custom cache key to use for storing the result.
   * If not provided, uses default key generation based on URL and method.
   */
  key?: string;

  /**
   * Time-to-live in milliseconds for the cached result.
   * If not provided, uses the default TTL configured in cache module.
   */
  ttl?: number;

  /**
   * Enable per-user caching. When true, each authenticated user gets separate cache entries.
   * This prevents data leakage between users while maintaining caching benefits.
   * @default true
   */
  perUser?: boolean;

  /**
   * Enable per-role caching. When true, users with the same role share cache entries.
   * Useful for role-based access control scenarios where users with same role see same data.
   */
  perRole?: boolean;
}

/**
 * Cache decorator that applies NestJS CacheInterceptor to methods or classes.
 *
 * This decorator provides a comprehensive caching solution with multiple strategies:
 * - Standard caching: Basic URL/method-based cache keys
 * - Per-user caching: Separate cache entries for each authenticated user
 * - Per-role caching: Shared cache entries for users with the same role
 *
 * The decorator automatically selects the appropriate interceptor based on the provided options
 * and applies additional cache configuration like custom keys and TTL.
 *
 * @param options - Optional configuration for caching behavior
 * @param options.key - Custom cache key (overrides default URL-based key generation)
 * @param options.ttl - Time-to-live in milliseconds for cached entries
 * @param options.perUser - Enable per-user caching (default: true)
 * @param options.perRole - Enable per-role caching (mutually exclusive with perUser)
 *
 * @example Basic caching with default settings
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @Cache()
 *   async getUsers() {
 *     // Cached per user by default
 *     return await this.userService.findAll();
 *   }
 * }
 * ```
 *
 * @example Custom key and TTL
 * ```typescript
 * @Get('statistics')
 * @Cache({ key: 'user-stats', ttl: 60000 })
 * async getUserStatistics() {
 *   // Cached for 60 seconds with custom key, still per-user
 *   return await this.statsService.getUserStats();
 * }
 * ```
 *
 * @example Role-based caching
 * ```typescript
 * @Get('admin-dashboard')
 * @Cache({ perRole: true, ttl: 300000 })
 * async getAdminDashboard() {
 *   // All users with same role share the same cached response
 *   return await this.dashboardService.getAdminData();
 * }
 * ```
 *
 * @example Global caching (no user/role isolation)
 * ```typescript
 * @Get('public-config')
 * @Cache({ perUser: false, ttl: 3600000 })
 * async getPublicConfig() {
 *   // Shared cache for all users (1 hour TTL)
 *   return await this.configService.getPublicConfig();
 * }
 * ```
 *
 * @example Controller-level caching
 * ```typescript
 * @Controller('products')
 * @Cache({ ttl: 300000 }) // 5 minutes TTL for all methods
 * export class ProductController {
 *   // All methods inherit the caching configuration
 * }
 * ```
 *
 * @returns Combined decorator that applies the appropriate CacheInterceptor with configuration
 */
export const Cache = (options?: CacheOptions) => {
  // Extract options with defaults
  const { key, ttl, perUser = true, perRole } = options || {};
  const decorators: Array<MethodDecorator & ClassDecorator> = [];

  // Select appropriate cache interceptor based on caching strategy
  if (perUser) {
    // Per-user caching: Each authenticated user gets separate cache entries
    // This is the default behavior to prevent data leakage between users
    decorators.push(UseInterceptors(UserCacheInterceptor));
  } else if (perRole) {
    // Per-role caching: Users with same role share cache entries
    // Useful for role-based data that doesn't vary between users of same role
    decorators.push(UseInterceptors(RoleCacheInterceptor));
  } else {
    // Standard caching: Global cache shared by all users
    // Use when data is truly public or when user context doesn't matter
    decorators.push(UseInterceptors(CacheInterceptor));
  }

  // Apply custom cache key if specified
  if (key) {
    decorators.push(CacheKey(key));
  }

  // Apply custom TTL if specified
  if (ttl) {
    decorators.push(CacheTTL(ttl));
  }

  return applyDecorators(...decorators);
};
