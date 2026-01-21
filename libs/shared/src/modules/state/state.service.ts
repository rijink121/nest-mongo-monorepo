import { ModelService, SearchFields, SqlService } from '@lib/sql';
import { Injectable } from '@nestjs/common';
import { State } from './entities/state.entity';

@Injectable()
export class StateService extends ModelService<State> {
  /**
   * searchFields
   * @property array of fields to include in search
   */
  searchFields: SearchFields<State> = {
    default: ['name'],
    withCountry: {
      fields: ['name', '$country.name$'],
      populate: ['country'],
    },
  };

  constructor(db: SqlService<State>) {
    super(db);
  }
}
