import { Module } from '@nestjs/common';
import { CoreService } from './core.service';
import { AppConfigModule } from './modules/app-config/app-config.module';

@Module({
  providers: [CoreService],
  exports: [CoreService],
  imports: [AppConfigModule],
})
export class CoreModule {}
