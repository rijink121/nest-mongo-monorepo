import { Module } from '@nestjs/common';
import { LocalAuthModule } from './modules/auth/strategies/local/local-auth.module';
import { HistoryModule } from './modules/history/history.module';
import { ProductModule } from './modules/product/product.module';
import { SessionModule } from './modules/session/session.module';
import { TrashModule } from './modules/trash/trash.module';
import { UserModule } from './modules/user/user.module';
import { SharedService } from './shared.service';

@Module({
  providers: [SharedService],
  exports: [SharedService],
  imports: [
    LocalAuthModule,
    ProductModule,
    TrashModule,
    HistoryModule,
    UserModule,
    SessionModule,
  ],
})
export class SharedModule {}
