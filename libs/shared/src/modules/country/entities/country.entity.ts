import { SqlSchema } from '@lib/sql/utils/schema';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Column, Table } from 'sequelize-typescript';

@Table
export class Country extends SqlSchema {
  @Column
  @ApiProperty({
    description: 'Country Name',
    example: 'United States',
  })
  @IsString()
  declare name: string;

  @Column
  @ApiProperty({
    description: 'Country Code (ISO 3166-1 alpha-2)',
    example: 'US',
  })
  @IsString()
  declare code: string;
}
