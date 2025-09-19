import { Injectable } from '@nestjs/common';
import { CreateTrashDto } from './dto/create-trash.dto';
import { UpdateTrashDto } from './dto/update-trash.dto';

@Injectable()
export class TrashService {
  create(createTrashDto: CreateTrashDto) {
    return 'This action adds a new trash';
  }

  findAll() {
    return `This action returns all trash`;
  }

  findOne(id: number) {
    return `This action returns a #${id} trash`;
  }

  update(id: number, updateTrashDto: UpdateTrashDto) {
    return `This action updates a #${id} trash`;
  }

  remove(id: number) {
    return `This action removes a #${id} trash`;
  }
}
