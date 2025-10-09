import { env } from '@core/utils/env';
import { validateEnvConfig } from '@core/utils/validate';
import { registerAs } from '@nestjs/config';
import { Type } from 'class-transformer';
import { IsInt, IsString, Max, Min } from 'class-validator';

/**
 * Redis environment configuration validation class.
 *
 * This class defines the structure and validation rules for Redis-related
 * environment variables. It uses class-validator decorators to ensure that
 * the Redis configuration is valid before the application starts.
 *
 * @example Environment variables
 * ```bash
 * # Redis host (default: localhost)
 * REDIS_HOST=localhost
 *
 * # Redis port (default: 6379)
 * REDIS_PORT=6379
 *
 * # Redis database number (default: 0)
 * REDIS_DB=0
 * ```
 */
export class RedisEnv {
  /**
   * Redis server hostname or IP address.
   *
   * The hostname or IP address of the Redis server to connect to.
   * Can be a domain name, IPv4, or IPv6 address.
   *
   * @default 'localhost'
   * @example Valid hosts
   * ```
   * localhost
   * 127.0.0.1
   * redis.example.com
   * my-redis-cluster.abc123.cache.amazonaws.com
   * ```
   */
  @IsString({
    message: 'REDIS_HOST must be a valid string',
  })
  REDIS_HOST: string;

  /**
   * Redis server port number.
   *
   * The port number on which the Redis server is listening.
   * Must be a valid integer port number between 1 and 65535.
   *
   * @default 6379
   */
  @Type(() => Number)
  @IsInt({ message: 'REDIS_PORT must be an integer' })
  @Min(1, { message: 'REDIS_PORT must be at least 1' })
  @Max(65535, { message: 'REDIS_PORT must be at most 65535' })
  REDIS_PORT: number;

  /**
   * Redis database number.
   *
   * The Redis database number to select. Redis supports multiple databases
   * numbered from 0 to 15 by default. Database 0 is selected by default.
   *
   * @default 0
   */
  @Type(() => Number)
  @IsInt({ message: 'REDIS_DB must be an integer' })
  @Min(0, {
    message: 'REDIS_DB must be a number between 0 and 15',
  })
  @Max(15, {
    message: 'REDIS_DB must be a number between 0 and 15',
  })
  REDIS_DB: number;
}

/**
 * Redis configuration provider for NestJS ConfigModule.
 *
 * This configuration provider:
 * - Initializes environment variables from local .env or AWS Secrets Manager
 * - Validates Redis connection settings against the RedisEnv schema
 * - Returns a properly configured Redis connection object
 * - Provides sensible defaults for development environment
 *
 * The configuration ensures that Redis connection parameters are valid
 * and provides clear validation errors if requirements are not met.
 *
 * @returns Promise resolving to Redis configuration object
 *
 * @example Usage in module
 * ```typescript
 * @Module({
 *   imports: [
 *     CacheModule.registerAsync({
 *       imports: [ConfigModule],
 *       useFactory: (config: ConfigService) => ({
 *         store: redisStore,
 *         url: config.get('redis').uri,
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example Environment setup
 * ```bash
 * # Optional: Redis host (default: localhost)
 * REDIS_HOST=localhost
 *
 * # Optional: Redis port (default: 6379)
 * REDIS_PORT=6379
 *
 * # Optional: Redis database (default: 0)
 * REDIS_DB=0
 * ```
 */
export default registerAs<{ uri: string }>(
  'redis',
  async (): Promise<{ uri: string }> => {
    // Initialize environment configuration and AWS Secrets Manager if configured
    await env.initialize();

    // Validate Redis environment variables against the schema
    const validatedEnv = validateEnvConfig(RedisEnv, {
      REDIS_HOST: env.get('REDIS_HOST', 'localhost'),
      REDIS_PORT: env.get('REDIS_PORT', 6379),
      REDIS_DB: env.get('REDIS_DB', 0),
    });

    // Return validated Redis configuration with properly formatted URI
    return {
      uri: `redis://${validatedEnv.REDIS_HOST}:${validatedEnv.REDIS_PORT}/${validatedEnv.REDIS_DB}`,
    };
  },
);
