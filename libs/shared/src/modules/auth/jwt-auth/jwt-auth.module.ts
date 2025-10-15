import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from '@shared/modules/user/user.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtAuthStrategy } from './jwt-auth.strategy';

@Module({
  imports: [UserModule],
  providers: [
    JwtAuthStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [JwtAuthStrategy],
})
export class JwtAuthModule {}
