import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/jwt-auth/jwt-auth.guard';
import { HistoryModule } from './modules/history/history.module';
import { OtpSessionModule } from './modules/otp-session/otp-session.module';
import { TrashModule } from './modules/trash/trash.module';
import { SharedService } from './shared.service';

@Module({
  imports: [OtpSessionModule],
})
export class SharedModule {
  static register(): DynamicModule {
    const imports: ModuleMetadata['imports'] = [TrashModule, HistoryModule];

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
