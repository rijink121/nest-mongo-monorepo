import { Module } from '@nestjs/common';
import { SessionModule } from '@shared/modules/session/session.module';
import { UserModule } from '@shared/modules/user/user.module';
import { LocalAuthController } from './local-auth.controller';
import { LocalAuthService } from './local-auth.service';
import { LocalAuthStrategy } from './local-auth.strategy';

@Module({
  imports: [SessionModule, UserModule],
  controllers: [LocalAuthController],
  providers: [LocalAuthService, LocalAuthStrategy],
})
export class LocalAuthModule {}
