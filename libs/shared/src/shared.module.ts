import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/jwt-auth/jwt-auth.guard';
import { JwtAuthModule } from './modules/auth/jwt-auth/jwt-auth.module';
import { LocalAuthModule } from './modules/auth/local-auth/local-auth.module';
import { TokenAuthModule } from './modules/auth/token-auth/token-auth.module';
import { HistoryModule } from './modules/history/history.module';
import { ProductRouteModule } from './modules/product/product-route.module';
import { SessionModule } from './modules/session/session.module';
import { TrashModule } from './modules/trash/trash.module';
import { UserRouteModule } from './modules/user/user-route.module';
import { SharedService } from './shared.service';

@Module({})
export class SharedModule {
  static register(appId: string): DynamicModule {
    const imports: ModuleMetadata['imports'] = [TrashModule, HistoryModule];

    switch (appId) {
      case 'main':
        imports.push(
          LocalAuthModule,
          JwtAuthModule,
          TokenAuthModule,
          ProductRouteModule,
          UserRouteModule,
          SessionModule,
        );
        break;
      case 'app-api':
        imports.push(
          LocalAuthModule,
          JwtAuthModule,
          TokenAuthModule,
          ProductRouteModule,
          UserRouteModule,
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
