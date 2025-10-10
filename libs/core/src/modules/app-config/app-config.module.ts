import { DynamicModule, Global, Module } from '@nestjs/common';

/**
 * Global module for providing application-wide configuration values.
 *
 * This module allows you to register a global provider for the application name (APP_NAME),
 * making it accessible throughout the entire NestJS application via dependency injection.
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [AppConfigModule.register('MyAppName')],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class AppConfigModule {
  /**
   * Registers the global APP_NAME provider.
   *
   * @param appName - The name of the application to be provided globally.
   * @returns A DynamicModule with the APP_NAME provider and export.
   */
  static register(appName: string): DynamicModule {
    return {
      module: AppConfigModule,
      providers: [
        {
          provide: 'APP_NAME',
          useValue: appName, // Application name available for injection
        },
      ],
      exports: ['APP_NAME'], // Export APP_NAME for use in other modules
    };
  }
}
