import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { ProductModule } from './modules/product/product.module';

@Module({
  providers: [SharedService],
  exports: [SharedService],
  imports: [ProductModule],
})
export class SharedModule {}
