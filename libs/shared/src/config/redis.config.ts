import { env } from '@core/utils/env';
import { registerAs } from '@nestjs/config';

/**
 * Redis configuration provider for Nest's ConfigModule.
 *
 * Resolves the Redis connection URI from the environment or AWS Secrets Manager
 * via the shared `env` utility. Defaults to a local URI for development.
 */
export default registerAs<{ uri: string }>(
  'redis',
  async (): Promise<{ uri: string }> => {
    // Ensure configuration and secrets are initialized before accessing values
    await env.initialize();

    return {
      uri: `redis://${env.get('REDIS_HOST', 'localhost')}:${parseInt(env.get('REDIS_PORT', '6379'), 10)}/${env.get('REDIS_DB', '0')}`,
    };
  },
);
