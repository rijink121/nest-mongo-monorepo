import { ModelService, SearchFields, SqlService } from '@lib/sql';
import { Injectable } from '@nestjs/common';
import { Country } from './entities/country.entity';

@Injectable()
export class CountryService extends ModelService<Country> {
  /**
   * searchFields
   * @property array of fields to include in search
   */
  searchFields: SearchFields<Country> = ['name', 'code'];

  constructor(db: SqlService<Country>) {
    super(db);
  }
}
