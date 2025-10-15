import { Module } from '@nestjs/common';
import { SessionModule } from '@shared/modules/session/session.module';
import { UserModule } from '@shared/modules/user/user.module';
import { TokenAuthController } from './token-auth.controller';
import { TokenAuthStrategy } from './token-auth.strategy';
import { TokenAuthService } from './token-auth.service';

@Module({
  imports: [UserModule, SessionModule],
  controllers: [TokenAuthController],
  providers: [TokenAuthStrategy, TokenAuthService],
})
export class TokenAuthModule {}
