import { SqlSchema } from '@lib/sql/utils/schema';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Column, Table } from 'sequelize-typescript';

@Table
export class Book extends SqlSchema {
  @Column
  @ApiProperty({
    description: 'Book Name',
    example: 'Harry Potter',
  })
  @IsString()
  declare name: string;
}
