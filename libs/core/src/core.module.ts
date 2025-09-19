import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { CoreService } from './core.service';
import { AppConfigModule } from './modules/app-config/app-config.module';

@Module({})
export class CoreModule {
  static register(appName: string): DynamicModule {
    return {
      module: CoreModule,
      imports: [
        AppConfigModule.register(appName),
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [join(process.cwd(), 'apps', appName, '.env'), '.env'],
        }),
        ClsModule.forRoot({
          global: true,
          middleware: {
            mount: true,
          },
        }),
      ],
      providers: [CoreService],
      exports: [CoreService],
    };
  }
}
