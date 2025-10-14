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
 *
 * Features:
 * - In-memory cache with LRU and TTL using KeyvCacheableMemory
 * - Redis cache for distributed caching using KeyvRedis
 * - Global cache availability for all modules
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [CachingModule],
 * })
 * export class AppModule {}
 * ```
 */

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true, // Make cache available globally
      imports: [ConfigModule.forRoot({ load: [redisConfig] })], // Load Redis config
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          stores: [
            // In-memory cache with LRU and TTL
            new Keyv({
              store: new KeyvCacheableMemory({ ttl: '60s', lruSize: 5000 }),
            }),
            // Redis cache for distributed caching
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
