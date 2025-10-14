import { Cache, CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';

/**
 * Base cache interceptor that extends NestJS CacheInterceptor with tag-based cache invalidation.
 *
 * This interceptor serves as the foundation for specialized cache interceptors (user-specific,
 * role-specific, etc.) and provides common functionality for cache key tracking and tag-based
 * invalidation. It maintains a mapping of controller tags to cache keys, enabling efficient
 * bulk cache invalidation.
 *
 * Key Features:
 * - Tag-based cache key tracking for efficient invalidation
 * - Base cache key generation using standard NestJS logic
 * - Support for derived interceptors to extend key generation
 *
 * Cache Tag Strategy:
 * - Each controller/route gets a tag (e.g., `tag:UserController`)
 * - All cache keys for that controller are tracked under the tag
 * - Enables invalidating all cached entries for a controller at once
 *
 * @example Usage in derived interceptors
 * ```typescript
 * @Injectable()
 * export class CustomCacheInterceptor extends BaseCacheInterceptor {
 *   trackBy(context: ExecutionContext): string | undefined {
 *     let baseKey = super.trackBy(context);
 *     // Extend with custom logic
 *     return baseKey;
 *   }
 * }
 * ```
 */
@Injectable()
export class BaseCacheInterceptor extends CacheInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,
    reflector: Reflector,
  ) {
    super(cacheManager, reflector);
  }

  /**
   * Generates the base cache key using standard NestJS logic.
   *
   * This method provides the foundation for cache key generation and can be extended
   * by derived interceptors to append user-specific, role-specific, or other contextual
   * information to the cache key.
   *
   * @param context - NestJS execution context containing HTTP request information
   * @returns Base cache key string, or undefined if key generation fails
   */
  trackBy(context: ExecutionContext): string | undefined {
    // Generate the base cache key using parent interceptor logic
    const baseKey = super.trackBy(context);

    // Return undefined if base key generation failed
    if (!baseKey) return undefined;

    // Register the key under the controller's tag for later invalidation
    void this.setKeyTag(context, baseKey);

    return baseKey;
  }

  /**
   * Associates a cache key with a controller tag for bulk invalidation.
   *
   * This method maintains a mapping between controller tags and their associated cache keys.
   * When a cache key is generated, it's registered under the controller's tag, allowing
   * all cache entries for a controller to be invalidated at once.
   *
   * @param context - NestJS execution context to extract controller information
   * @param key - The cache key to register under the controller tag
   *
   * @example Tag structure
   * ```
   * tag:UserController -> ['user:123', 'user:456', 'user:789']
   * tag:ProductController -> ['product:list', 'product:details']
   * ```
   */
  async setKeyTag(context: ExecutionContext, key: string): Promise<void> {
    // Extract controller class name from metadata
    const tagName = this.reflector.get<string>(
      PATH_METADATA,
      context.getClass(),
    );

    // Construct the tag key (e.g., 'tag:UserController')
    const tagKey = `tag:${tagName}`;

    // Retrieve existing keys for this tag, or initialize empty array
    const keys = (await this.cacheManager.get<string[]>(tagKey)) || [];

    // Add the new key if it's not already tracked
    if (!keys.includes(key)) {
      keys.push(key);
      await this.cacheManager.set(tagKey, keys);
    }
  }
}
