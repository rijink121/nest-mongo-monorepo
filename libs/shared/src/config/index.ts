import { CacheManagerOptions } from '@nestjs/cache-manager';
import { ThrottlerOptions } from '@nestjs/throttler';
import { CDNStorage, Environment } from '@shared/constants/app.contants';
import { join } from 'path/win32';

export default () => ({
  /**
   * @property {Environment} env - environment
   * @default development
   */
  env: process.env.NODE_ENV || Environment.Development,
  /**
   * @property {string} baseURL - app base url or domain
   * @default http://localhost:{port}/
   */
  baseURL:
    process.env.BASE_URL ||
    `http://localhost:${parseInt(process.env.PORT || '3000', 10)}/`,
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
   * @default cdn/
   */
  cdnServeRoot: '/cdn',
  /**
   * @property {string} cdnURL
   * Serve static url, when using /cdn as value public files will be available at http://localhost:{port}/cdn/
   */
  cdnURL:
    process.env.CDN_URL ||
    (process.env.BASE_URL ||
      `http://localhost:${parseInt(process.env.PORT || '3000', 10)}/`) + 'cdn/',
  /**
   * @property {string} cdnLocalURL
   * Serve static url, when using /cdn as value public files will be available at http://localhost:{port}/cdn/
   */
  cdnLocalURL:
    (process.env.BASE_URL ||
      `http://localhost:${parseInt(process.env.PORT || '3000', 10)}/`) + 'cdn/',
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
});
