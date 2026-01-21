import { CoreModule } from '@core';
import { MongoModule } from '@lib/mongo';
import { SqlModule } from '@lib/sql';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '@shared';
import sharedConfig from '@shared/config';
import { JwtAuthModule } from '@shared/modules/auth/jwt-auth/jwt-auth.module';
import { LocalAuthModule } from '@shared/modules/auth/local-auth/local-auth.module';
import { RecoveryModule } from '@shared/modules/auth/recovery/recovery.module';
import { TokenAuthModule } from '@shared/modules/auth/token-auth/token-auth.module';
import { BookModule } from '@shared/modules/book/book.module';
import { CityRouteModule } from '@shared/modules/city/city-route.module';
import { CountryRouteModule } from '@shared/modules/country/country-route.module';
import { ProductRouteModule } from '@shared/modules/product/product-route.module';
import { SessionModule } from '@shared/modules/session/session.module';
import { StateRouteModule } from '@shared/modules/state/state-route.module';
import { UserRouteModule } from '@shared/modules/user/user-route.module';
import { join } from 'path';
import { appId } from './app.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), 'apps', appId, '.env'), '.env'],
      load: [sharedConfig, config],
    }),
    CoreModule.register(appId),
    MongoModule.forRoot({ seeder: true }),
    SqlModule.forRoot({ seeder: true }),
    SharedModule.register(),
    LocalAuthModule,
    JwtAuthModule,
    TokenAuthModule,
    RecoveryModule,
    ProductRouteModule,
    UserRouteModule,
    CountryRouteModule,
    StateRouteModule,
    CityRouteModule,
    SessionModule,
    BookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
