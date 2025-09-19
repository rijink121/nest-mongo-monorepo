import { MongoModule } from '@lib/mongo/mongo.module';
import { Module } from '@nestjs/common';
import { Product, ProductSchema } from './entities/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [
    MongoModule.register({ name: Product.name, schema: ProductSchema }),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
