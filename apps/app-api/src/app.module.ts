import { CoreModule } from '@core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '@shared';
import sharedConfig from '@shared/config';
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
    SharedModule.register(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
