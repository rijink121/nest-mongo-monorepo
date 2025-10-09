import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

/**
 * Singleton class for managing environment variables and AWS Secrets Manager integration.
 * Provides a unified interface to access configuration values from both process.env
 * and AWS Secrets Manager.
 */
class EnvironmentManager {
  private static instance: EnvironmentManager;
  private secrets: Record<string, string> = {};
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Gets the singleton instance of EnvironmentManager
   * @returns The singleton instance
   */
  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }

    return EnvironmentManager.instance;
  }

  /**
   * Initializes the environment manager by loading secrets from AWS Secrets Manager.
   * This method is idempotent and can be safely called multiple times.
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initPromise !== null) return this.initPromise;

    this.initPromise = this.loadSecrets();
    await this.initPromise;
    this.isInitialized = true;
  }

  /**
   * Loads secrets from AWS Secrets Manager using the AWS_ENV_SECRET_ID environment variable.
   * If the secret ID is not provided, this method returns early without error.
   * @private
   * @returns Promise that resolves when secrets are loaded
   * @throws Error if SecretString is not found in the response
   */
  private async loadSecrets(): Promise<void> {
    const secretId = process.env.AWS_ENV_SECRET_ID;

    // Exit early if no secret ID is configured
    if (!secretId) return;

    try {
      const client = new SecretsManagerClient();
      const command = new GetSecretValueCommand({ SecretId: secretId });
      const response = await client.send(command);

      if (!response.SecretString) {
        throw new Error(
          'SecretString not found in AWS Secrets Manager response',
        );
      }

      // Parse the JSON secrets and validate the structure
      const parsedSecrets = JSON.parse(response.SecretString) as unknown;

      // Type guard to ensure we have a valid object with string values
      if (this.isValidSecretsObject(parsedSecrets)) {
        this.secrets = parsedSecrets;
      } else {
        throw new Error(
          'Invalid secrets format: expected object with string values',
        );
      }
    } catch (error) {
      // Log the error and re-throw for proper error handling
      console.error('Failed to load secrets from AWS Secrets Manager:', error);
      throw error;
    }
  }

  /**
   * Type guard to validate that the parsed secrets object has the expected structure
   * @private
   * @param obj The object to validate
   * @returns True if the object is a valid secrets object
   */
  private isValidSecretsObject(obj: unknown): obj is Record<string, string> {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      Object.values(obj).every((value) => typeof value === 'string')
    );
  }

  /**
   * Gets an environment variable value, checking secrets first, then process.env, then defaultValue.
   *
   * The resolution priority is:
   * 1. AWS Secrets Manager (if configured and initialized)
   * 2. Process environment variables (process.env)
   * 3. Default value (if provided and not ignored in production)
   *
   * @template T The expected type of the value
   * @param name The name of the environment variable
   * @param defaultValue Optional default value to return if the variable is not found
   * @param ignoreDefaultInProduction If true, ignores the default value when NODE_ENV is 'production'.
   *                                  This ensures production environments must provide explicit values
   *                                  for critical configuration, preventing fallback to development defaults.
   * @returns The environment variable value cast to type T
   * @throws Error if the EnvironmentManager is not initialized
   *
   * @example Basic usage
   * ```typescript
   * const port = env.get('PORT', '3000');
   * ```
   *
   * @example With production safety
   * ```typescript
   * // This will throw in production if DATABASE_URL is not set
   * const dbUrl = env.get('DATABASE_URL', 'mongodb://localhost/dev', true);
   * ```
   *
   * @example Typed values
   * ```typescript
   * const port = env.get<number>('PORT', 3000);
   * const isDebug = env.get<boolean>('DEBUG', false);
   * ```
   */
  get<T = string>(
    name: string,
    defaultValue?: T,
    ignoreDefaultInProduction?: boolean,
  ): T {
    if (!this.isInitialized) {
      throw new Error(
        'EnvironmentManager not initialized. Call initialize() first.',
      );
    }

    defaultValue =
      ignoreDefaultInProduction && process.env.NODE_ENV === 'production'
        ? undefined
        : defaultValue;
    // Priority: secrets > process.env > defaultValue
    const value = this.secrets[name] ?? (process.env[name] || defaultValue);

    return value as T;
  }
}

/**
 * Singleton instance of EnvironmentManager for global use.
 *
 * Usage:
 * ```typescript
 * import { env } from './env';
 *
 * // Initialize first (usually in main.ts or app startup)
 * await env.initialize();
 *
 * // Then use anywhere in your application
 * const databaseUrl = env.get('DATABASE_URL');
 * const port = env.get<number>('PORT', 3000);
 * ```
 */
export const env = EnvironmentManager.getInstance();
