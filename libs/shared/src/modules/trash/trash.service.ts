import { ModelService, MongoService } from '@lib/mongo';
import { Injectable } from '@nestjs/common';
import { Trash } from './entities/trash.entity';

@Injectable()
export class TrashService extends ModelService<Trash> {
  constructor(db: MongoService<Trash>) {
    super(db);
  }
}
