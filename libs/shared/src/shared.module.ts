import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/strategies/jwt/jwt-auth.guard';
import { LocalAuthModule } from './modules/auth/strategies/local/local-auth.module';
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
          ProductRouteModule,
          UserRouteModule,
          SessionModule,
        );
        break;
      case 'admin':
        imports.push(ProductRouteModule, UserRouteModule, SessionModule);
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
