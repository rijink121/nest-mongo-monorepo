import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/jwt-auth/jwt-auth.guard';
import { JwtAuthModule } from './modules/auth/jwt-auth/jwt-auth.module';
import { LocalAuthModule } from './modules/auth/local-auth/local-auth.module';
import { RecoveryModule } from './modules/auth/recovery/recovery.module';
import { TokenAuthModule } from './modules/auth/token-auth/token-auth.module';
import { CountryRouteModule } from './modules/country/country-route.module';
import { HistoryModule } from './modules/history/history.module';
import { OtpSessionModule } from './modules/otp-session/otp-session.module';
import { ProductRouteModule } from './modules/product/product-route.module';
import { SessionModule } from './modules/session/session.module';
import { StateRouteModule } from './modules/state/state-route.module';
import { TrashModule } from './modules/trash/trash.module';
import { UserRouteModule } from './modules/user/user-route.module';
import { SharedService } from './shared.service';

@Module({
  imports: [OtpSessionModule],
})
export class SharedModule {
  static register(appId: string): DynamicModule {
    const imports: ModuleMetadata['imports'] = [TrashModule, HistoryModule];

    switch (appId) {
      case 'main':
        imports.push(
          LocalAuthModule,
          JwtAuthModule,
          TokenAuthModule,
          RecoveryModule,
          ProductRouteModule,
          UserRouteModule,
          CountryRouteModule,
          StateRouteModule,
          SessionModule,
        );
        break;
      case 'app-api':
        imports.push(
          LocalAuthModule,
          JwtAuthModule,
          TokenAuthModule,
          RecoveryModule,
          ProductRouteModule,
          UserRouteModule,
          CountryRouteModule,
          StateRouteModule,
          SessionModule,
        );
        break;

      default:
        break;
    }

    return {
      module: SharedModule,
      providers: [
        SharedService,
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
      exports: [SharedService],
      imports,
    };
  }
}
