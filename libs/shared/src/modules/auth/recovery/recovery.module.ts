import { Module } from '@nestjs/common';
import { OtpSessionModule } from '@shared/modules/otp-session/otp-session.module';
import { SessionModule } from '@shared/modules/session/session.module';
import { UserModule } from '@shared/modules/user/user.module';
import { RecoveryController } from './recovery.controller';
import { RecoveryService } from './recovery.service';

@Module({
  imports: [UserModule, SessionModule, OtpSessionModule],
  controllers: [RecoveryController],
  providers: [RecoveryService],
})
export class RecoveryModule {}
