import { env } from '@core/utils/env';
import { validateEnvConfig } from '@core/utils/validate';
import { CacheManagerOptions } from '@nestjs/cache-manager';
import { ThrottlerOptions } from '@nestjs/throttler';
import { CDNStorage, Environment } from '@shared/constants/app.contants';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsUrl, Max, Min } from 'class-validator';
import { join } from 'path';

/**
 * Base application environment configuration validation class.
 *
 * This class defines the structure and validation rules for core application
 * environment variables that are shared across different configurations.
 *
 * @example Environment variables
 * ```bash
 * # Application port (default: 3000)
 * PORT=3000
 *
 * # Application base URL (default: http://localhost:{port}/)
 * BASE_URL=http://localhost:3000/
 * ```
 */
export class AppEnv {
  /**
   * Application port number.
   *
   * @default 3000
   */
  @Type(() => Number)
  @IsInt({ message: 'PORT must be an integer' })
  @Min(1, { message: 'PORT must be at least 1' })
  @Max(65535, { message: 'PORT must be at most 65535' })
  PORT: number;

  /**
   * Base URL of the application.
   *
   * Must be a valid HTTP/HTTPS URL. Defaults to http://localhost:{port}/
   *
   * @example Valid URLs
   * ```
   * http://localhost:3000/
   * https://myapp.example.com/
   * http://192.168.1.100:8080/
   * ```
   */
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_tld: false,
    },
    {
      message: 'BASE_URL must be a valid URL with http or https protocol',
    },
  )
  BASE_URL: string;
}

/**
 * Shared configuration environment validation class.
 *
 * This class defines the structure and validation rules for shared
 * environment variables used across the application.
 */
class SharedEnv extends AppEnv {
  /**
   * Application environment.
   *
   * @default Environment.Development
   */
  @IsEnum(Environment, {
    message: 'NODE_ENV must be one of: development, staging, production',
  })
  NODE_ENV: Environment;

  /**
   * CDN URL for serving static assets.
   *
   * Must be a valid HTTP/HTTPS URL. Defaults to {BASE_URL}/cdn/
   *
   * @example Valid CDN URLs
   * ```
   * http://localhost:3000/cdn/
   * https://cdn.myapp.com/
   * https://myapp.s3.amazonaws.com/
   * ```
   */
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_tld: false,
    },
    {
      message: 'CDN_URL must be a valid URL with http or https protocol',
    },
  )
  CDN_URL: string;
}

export default async () => {
  // Initialize environment configuration and AWS Secrets Manager if configured
  await env.initialize();

  // Validate shared environment variables against the schema
  const validatedEnv = validateEnvConfig(SharedEnv, {
    NODE_ENV: env.get('NODE_ENV', Environment.Development),
    PORT: env.get('PORT', 3000),
    BASE_URL: env.get(
      'BASE_URL',
      `http://localhost:${env.get('PORT', 3000)}/`,
      true,
    ),
    CDN_URL: env.get(
      'CDN_URL',
      env.get('BASE_URL', `http://localhost:${env.get('PORT', 3000)}/`, true) +
        'cdn/',
    ),
  });

  return {
    /**
     * @property {Environment} env - application environment
     * @default Environment.Development
     */
    env: validatedEnv.NODE_ENV,
    /**
     * @property {boolean} cdnStatic
     * Serve a static folder inside app, set to false if not required (when using s3 or any other services)
     * @default true
     */
    cdnStatic: true,
    /**
     * @property {CDNStorage} cdnStorage
     * Default CDN storage, eg: Local Drive, Aws S3, Azure Storage, etc
     * @default 0 (Local Storage)
     */
    cdnStorage: CDNStorage.Local,
    /**
     * @property {string} cdnPath
     * Path to serve static, by default it will use public/ folder
     */
    cdnPath: join(__dirname, '..', 'public'),
    /**
     * @property {string} cdnServeRoot
     * Prefix to serve static url, when using /cdn as value public files will be available at http://localhost:{port}/cdn/
     * @default /cdn
     */
    cdnServeRoot: '/cdn',
    /**
     * @property {string} cdnURL
     * CDN URL for serving static assets, can be external CDN or local path
     */
    cdnURL: validatedEnv.CDN_URL,
    /**
     * @property {string} cdnLocalURL
     * Local CDN URL constructed from base URL + /cdn/, used as fallback or local development
     */
    cdnLocalURL: validatedEnv.BASE_URL + 'cdn/',
    /**
     * @property {number} paginationLimit
     * Default pagination limit
     * @default 10
     */
    paginationLimit: 10,
    /**
     * @property {number} paginationMaxLimit
     * Maximum pagination limit (used for limit: -1)
     * @default 1000
     */
    paginationMaxLimit: 1000,
    /**
     * @property {ThrottlerOptions} throttler
     * Rate Limiting configuration
     */
    throttler: <ThrottlerOptions>{
      ttl: 60,
      limit: 10,
    },
    /**
     * @property {CacheManagerOptions} cache
     * Cache configuration
     */
    cache: <CacheManagerOptions>{
      ttl: 60,
    },
  };
};
