import { ModelService, MongoService, SearchFields } from '@lib/mongo';
import { Injectable } from '@nestjs/common';
import { Country } from './entities/country.entity';

@Injectable()
export class CountryService extends ModelService<Country> {
  /**
   * searchFields
   * @property array of fields to include in search
   */
  searchFields: SearchFields<Country> = ['name', 'code'];

  constructor(db: MongoService<Country>) {
    super(db);
  }
}
