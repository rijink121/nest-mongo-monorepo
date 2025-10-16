import { ModelService, MongoService, SearchFields } from '@lib/mongo';
import { Injectable } from '@nestjs/common';
import { City } from './entities/city.entity';

@Injectable()
export class CityService extends ModelService<City> {
  /**
   * searchFields
   * @property array of fields to include in search
   */
  searchFields: SearchFields<City> = ['name', 'code'];

  constructor(db: MongoService<City>) {
    super(db);
  }
}
