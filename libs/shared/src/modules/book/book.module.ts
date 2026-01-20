import { SqlModule } from '@lib/sql';
import { Module } from '@nestjs/common';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { Book } from './entities/book.entity';

@Module({
  imports: [SqlModule.forFeature(Book)],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}
