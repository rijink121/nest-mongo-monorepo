import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { CoreService } from './core.service';
import { AppConfigModule } from './modules/app-config/app-config.module';
import { LanguageModule } from './modules/language/language.module';

@Module({
  imports: [LanguageModule],
})
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
      ],
      providers: [CoreService],
      exports: [CoreService],
    };
  }
}
