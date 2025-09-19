import { Module } from '@nestjs/common';
import { ProductModule } from './modules/product/product.module';
import { SharedService } from './shared.service';
import { TrashModule } from './modules/trash/trash.module';
import { HistoryModule } from './modules/history/history.module';

@Module({
  providers: [SharedService],
  exports: [SharedService],
  imports: [ProductModule, TrashModule, HistoryModule],
})
export class SharedModule {}
