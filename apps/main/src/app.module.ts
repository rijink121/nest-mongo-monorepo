import { CoreModule } from '@core';
import { AppConfigModule } from '@core/modules/app-config/app-config.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from '@shared';
import { join } from 'path';
import { APP_NAME } from './app.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), 'apps', APP_NAME, '.env'), '.env'],
    }),
    AppConfigModule.register(APP_NAME),
    CoreModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
