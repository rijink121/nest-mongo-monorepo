import { KeyvCacheableMemory } from '@cacheable/memory';
import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import redisConfig from '@shared/config/redis.config';
import { Keyv } from 'keyv';
import { CachingService } from './caching.service';

/**
 * Module for configuring and providing global caching support.
 *
 * This module sets up the NestJS CacheModule with both in-memory and Redis stores using Keyv.
 * It loads Redis configuration from the shared config and makes the cache available globally.
 * The Redis cache uses the APP_ID as a namespace to isolate cache entries per application.
 *
 * Features:
 * - In-memory cache with LRU and TTL using KeyvCacheableMemory
 * - Redis cache for distributed caching using KeyvRedis
 * - Application-specific namespace using APP_ID for cache isolation
 * - Global cache availability for all modules
 *
 * @example Usage in AppModule
 * ```typescript
 * @Module({
 *   imports: [
 *     AppConfigModule.register('my-app-id'), // Required: Register APP_ID first
 *     CachingModule,
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example Cache isolation
 * ```
 * App 1 (APP_ID: 'api'): Redis keys prefixed with 'api:'
 * App 2 (APP_ID: 'worker'): Redis keys prefixed with 'worker:'
 * ```
 */

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true, // Make cache available globally
      imports: [ConfigModule.forRoot({ load: [redisConfig] })], // Load Redis config
      inject: [ConfigService, 'APP_ID'], // Inject ConfigService and APP_ID
      useFactory: (config: ConfigService, appId: string) => {
        return {
          ttl: config.get('cache.ttl'), // Default TTL of 60 seconds for cache entries
          namespace: `${appId}:`, // Use APP_ID for namespace isolation
          stores: [
            // In-memory cache with LRU and TTL
            new Keyv({
              store: new KeyvCacheableMemory({ lruSize: 5000 }),
            }),
            // Redis cache for distributed caching with app-specific namespace
            new KeyvRedis(config.get('redis.uri')),
          ],
        };
      },
    }),
  ],
  providers: [CachingService],
  exports: [CachingService],
})
export class CachingModule {}
