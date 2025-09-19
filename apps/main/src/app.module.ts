import { CoreModule } from '@core';
import { MongoModule } from '@lib/mongo';
import { Module } from '@nestjs/common';
import { SharedModule } from '@shared';
import { APP_NAME } from './app.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    CoreModule.register(APP_NAME),
    MongoModule.root({ seeder: true }),
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
