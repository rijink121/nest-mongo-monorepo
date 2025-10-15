import { Module } from '@nestjs/common';
import { UserModule } from '@shared/modules/user/user.module';
import { AuthModule } from '../../../../../libs/shared/src/modules/auth/auth.module';
import { LocalAuthController } from './local-auth.controller';
import { LocalAuthService } from './local-auth.service';
import { LocalAuthStrategy } from './local-auth.strategy';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [LocalAuthController],
  providers: [LocalAuthService, LocalAuthStrategy],
})
export class LocalAuthModule {}
