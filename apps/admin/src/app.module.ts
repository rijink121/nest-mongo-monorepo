import { CoreModule } from '@core';
import { Module } from '@nestjs/common';
import { SharedModule } from '@shared';
import { APP_NAME } from './app.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [CoreModule.register(APP_NAME), SharedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
