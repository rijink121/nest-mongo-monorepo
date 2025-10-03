import { ModelService, MongoService, SearchFields } from '@lib/mongo';
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';

@Injectable()
export class UserService extends ModelService<User> {
  /**
   * searchFields
   * @property array of fields to include in search
   */
  searchFields: SearchFields<User> = ['name'];

  constructor(db: MongoService<User>) {
    super(db);
  }
}
