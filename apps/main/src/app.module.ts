import { CoreModule } from '@core';
import { MongoModule } from '@lib/mongo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '@shared';
import sharedConfig from '@shared/config';
import { join } from 'path';
import { appId } from './app.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './config';
import { LocalAuthModule } from './modules/auth/local-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), 'apps', appId, '.env'), '.env'],
      load: [sharedConfig, config],
    }),
    CoreModule.register(appId),
    MongoModule.root({ seeder: true }),
    LocalAuthModule,
    SharedModule.register(appId),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
