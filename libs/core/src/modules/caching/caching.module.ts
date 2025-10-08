import { KeyvCacheableMemory } from '@cacheable/memory';
import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import redisConfig from '@shared/config/redis.config';
import { Keyv } from 'keyv';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule.forRoot({ load: [redisConfig] })],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          stores: [
            new Keyv({
              store: new KeyvCacheableMemory({ ttl: '60s', lruSize: 5000 }),
            }),
            new KeyvRedis(config.get('redis.uri')),
          ],
        };
      },
    }),
  ],
})
export class CachingModule {}
