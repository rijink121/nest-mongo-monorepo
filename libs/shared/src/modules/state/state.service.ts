import { ModelService, MongoService, SearchFields } from '@lib/mongo';
import { Injectable } from '@nestjs/common';
import { State } from './entities/state.entity';

@Injectable()
export class StateService extends ModelService<State> {
  /**
   * searchFields
   * @property array of fields to include in search
   */
  searchFields: SearchFields<State> = ['name', 'code'];

  constructor(db: MongoService<State>) {
    super(db);
  }
}
