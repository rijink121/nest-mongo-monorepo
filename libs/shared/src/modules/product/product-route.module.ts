import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductModule } from './product.module';

@Module({
  imports: [ProductModule],
  controllers: [ProductController],
})
export class ProductRouteModule {}
