import { ModelService, SearchFields, SqlService } from '@lib/sql';
import { Injectable } from '@nestjs/common';
import { Book } from './entities/book.entity';

@Injectable()
export class BookService extends ModelService<Book> {
  /**
   * searchFields
   * @property array of fields to include in search
   */
  searchFields: SearchFields<Book> = ['name'];

  constructor(db: SqlService<Book>) {
    super(db);
  }
}
