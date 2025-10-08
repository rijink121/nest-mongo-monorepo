import { PartialType } from '@nestjs/swagger';
import { CreateTrashDto } from './create-trash.dto';

export class UpdateTrashDto extends PartialType(CreateTrashDto) {}
