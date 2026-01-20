import { ModelService, SearchFields, SqlService } from '@lib/sql';
import { Injectable } from '@nestjs/common';
import { City } from './entities/city.entity';

@Injectable()
export class CityService extends ModelService<City> {
  /**
   * searchFields
   * @property array of fields to include in search
   */
  searchFields: SearchFields<City> = ['name', 'code'];

  constructor(db: SqlService<City>) {
    super(db);
  }
}
