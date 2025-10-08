import { ModelService, MongoService, SearchFields } from '@lib/mongo';
import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService extends ModelService<Product> {
  /**
   * searchFields
   * @property array of fields to include in search
   */
  searchFields: SearchFields<Product> = ['name'];

  constructor(db: MongoService<Product>) {
    super(db);
  }
}
