import { OmitType } from '@nestjs/swagger';
import { Book } from '../entities/book.entity';

export class CreateBookDto extends OmitType(Book, ['active'] as const) {}
