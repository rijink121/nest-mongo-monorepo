import { ModelService, SearchFields, SqlService } from '@lib/sql';
import { Injectable } from '@nestjs/common';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleService extends ModelService<Role> {
  /**
   * searchFields
   * @property array of fields to include in search
   */
  searchFields: SearchFields<Role> = ['name'];

  constructor(db: SqlService<Role>) {
    super(db);
  }
}
