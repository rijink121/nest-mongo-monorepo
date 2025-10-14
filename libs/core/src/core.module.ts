import { DynamicModule, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { CoreService } from './core.service';
import { AppConfigModule } from './modules/app-config/app-config.module';
import { CachingModule } from './modules/caching/caching.module';
import { LanguageModule } from './modules/language/language.module';
import { MsClientModule } from './modules/ms-client/ms-client.module';

@Module({})
export class CoreModule {
  static register(appId: string): DynamicModule {
    return {
      module: CoreModule,
      imports: [
        AppConfigModule.register(appId),
        ClsModule.forRoot({
          global: true,
          middleware: {
            mount: true,
          },
        }),
        CachingModule,
        LanguageModule,
        MsClientModule,
      ],
      providers: [CoreService],
      exports: [CoreService],
    };
  }
}
