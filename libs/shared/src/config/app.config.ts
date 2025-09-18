import { AppEngine, SqlDialect } from '@shared/constants/app.contants';

/**
 * Application configuration constants for the shared library.
 * These values define core application settings that are used across
 * multiple modules and services.
 */

/**
 * Default database engine for the application.
 * Can be overridden via the APP_ENGINE environment variable.
 *
 * @type {AppEngine}
 * @default AppEngine.SQL
 * @example
 * ```typescript
 * // Environment variable usage
 * APP_ENGINE=mongo
 *
 * // Programmatic usage
 * if (defaultEngine === AppEngine.Mongo) {
 *   // Use MongoDB specific logic
 * }
 * ```
 */
export const defaultEngine: AppEngine =
  (process.env.APP_ENGINE as AppEngine) || AppEngine.SQL;

/**
 * Default SQL database dialect when using SQL engine.
 * Defines which SQL database system to target for query generation
 * and database-specific functionality.
 *
 * @type {SqlDialect}
 * @default SqlDialect.MySQL
 * @example
 * ```typescript
 * // Usage in database configuration
 * const dbConfig = {
 *   dialect: sqlDialect,
 *   // other config options
 * };
 * ```
 */
export const sqlDialect: SqlDialect = SqlDialect.MySQL;

/**
 * Human-readable name of the application.
 * Used for display purposes, logging, and API documentation.
 *
 * @type {string}
 * @readonly
 */
export const appName = 'NewAgeSmb Core Framework';

/**
 * Current version of the application.
 * Used for API versioning, compatibility checks, and feature gating.
 *
 * @type {number}
 * @default 1
 * @example
 * ```typescript
 * // Version-based feature toggle
 * if (appVersion >= 2) {
 *   // Enable new features
 * }
 * ```
 */
export const appVersion = 1;

/**
 * Minimum supported version of the application.
 * Used for backward compatibility checks and deprecation warnings.
 * Clients below this version should be encouraged to upgrade.
 *
 * @type {number}
 * @default 1
 * @example
 * ```typescript
 * // Compatibility check
 * if (clientVersion < appMinVersion) {
 *   throw new Error('Client version not supported');
 * }
 * ```
 */
export const appMinVersion = 1;
