import { env } from '@core/utils/env';
import { registerAs } from '@nestjs/config';
import { RedisOptions, Transport } from '@nestjs/microservices';

/* Micro service config */
export default registerAs<RedisOptions>(
  'ms',
  async (): Promise<RedisOptions> => {
    await env.initialize();
    return {
      transport: Transport.REDIS,
      options: {
        host: env.get('REDIS_HOST', 'localhost'),
        port: parseInt(env.get('REDIS_PORT', '6379'), 10),
        db: parseInt(env.get('REDIS_DB', '0'), 10),
        retryAttempts: 5,
        retryDelay: 3000,
      },
    };
  },
);
