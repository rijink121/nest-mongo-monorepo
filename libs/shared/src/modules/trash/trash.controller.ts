import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TrashService } from './trash.service';
import { CreateTrashDto } from './dto/create-trash.dto';
import { UpdateTrashDto } from './dto/update-trash.dto';

@Controller('trash')
export class TrashController {
  constructor(private readonly trashService: TrashService) {}

  @Post()
  create(@Body() createTrashDto: CreateTrashDto) {
    return this.trashService.create(createTrashDto);
  }

  @Get()
  findAll() {
    return this.trashService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trashService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrashDto: UpdateTrashDto) {
    return this.trashService.update(+id, updateTrashDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trashService.remove(+id);
  }
}
