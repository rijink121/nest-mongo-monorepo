import { env } from '@core/utils/env';
import { validateEnvConfig } from '@core/utils/validate';
import { registerAs } from '@nestjs/config';
import { RedisOptions, Transport } from '@nestjs/microservices';
import { RedisEnv } from './redis.config';

/**
 * Microservice configuration provider for NestJS ConfigModule.
 *
 * This configuration provider:
 * - Initializes environment variables from local .env or AWS Secrets Manager
 * - Validates Redis connection settings using the shared RedisEnv validation class
 * - Returns a properly configured RedisOptions object for microservice transport
 * - Provides additional microservice-specific settings (retry attempts, delay)
 * - Ensures consistency with redis.config.ts by reusing the same validation rules
 *
 * @returns Promise resolving to RedisOptions for @nestjs/microservices
 */
export default registerAs<RedisOptions>(
  'ms',
  async (): Promise<RedisOptions> => {
    // Initialize environment configuration and AWS Secrets Manager if configured
    await env.initialize();

    // Validate Redis environment variables against the schema
    // This ensures the same validation rules as redis.config.ts
    const validatedEnv = validateEnvConfig(RedisEnv, {
      REDIS_HOST: env.get('REDIS_HOST', 'localhost'),
      REDIS_PORT: env.get('REDIS_PORT', 6379),
      REDIS_DB: env.get('REDIS_DB', 0),
    });

    // Return validated Redis configuration for microservice transport
    return {
      transport: Transport.REDIS,
      options: {
        host: validatedEnv.REDIS_HOST,
        port: validatedEnv.REDIS_PORT,
        db: validatedEnv.REDIS_DB,
        retryAttempts: 5,
        retryDelay: 3000,
      },
    };
  },
);
