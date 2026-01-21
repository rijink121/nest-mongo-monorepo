import { SqlSchema } from '@lib/sql/utils/schema';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Column, Table } from 'sequelize-typescript';

@Table
export class Role extends SqlSchema {
  @Column
  @ApiProperty({
    description: 'Role Name',
    example: 'Admin',
  })
  @IsString()
  declare name: string;
}
