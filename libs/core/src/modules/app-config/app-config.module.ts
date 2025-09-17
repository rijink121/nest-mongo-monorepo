import { DynamicModule, Global, Module } from '@nestjs/common';

@Global()
@Module({})
export class AppConfigModule {
  static register(appName: string): DynamicModule {
    return {
      module: AppConfigModule,
      providers: [
        {
          provide: 'APP_NAME',
          useValue: appName,
        },
      ],
      exports: ['APP_NAME'],
    };
  }
}
