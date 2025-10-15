import { DynamicModule, Global, Module } from '@nestjs/common';

/**
 * Global module for providing application-wide configuration values.
 *
 * This module allows you to register a global provider for the application ID (APP_ID),
 * making it accessible throughout the entire NestJS application via dependency injection.
 *
 * @example Usage in AppModule
 * ```typescript
 * @Module({
 *   imports: [AppConfigModule.register('my-app-id')],
 * })
 * export class AppModule {}
 * ```
 *
 * @example Injecting APP_ID in a service
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(@Inject('APP_ID') private appId: string) {}
 *
 *   getAppInfo() {
 *     return { appId: this.appId };
 *   }
 * }
 * ```
 */
@Global()
@Module({})
export class AppConfigModule {
  /**
   * Registers the global APP_ID provider.
   *
   * @param appId - The unique identifier of the application to be provided globally.
   * @returns A DynamicModule with the APP_ID provider and export.
   */
  static register(appId: string): DynamicModule {
    return {
      module: AppConfigModule,
      providers: [
        {
          provide: 'APP_ID',
          useValue: appId, // Application ID available for injection
        },
      ],
      exports: ['APP_ID'], // Export APP_ID for use in other modules
    };
  }
}
