import { MongoModule } from '@lib/mongo/mongo.module';
import { Module } from '@nestjs/common';
import { Product, ProductSchema } from './entities/product.entity';
import { ProductService } from './product.service';

@Module({
  imports: [
    MongoModule.register(
      { name: Product.name, schema: ProductSchema },
      { cache: true },
    ),
  ],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
