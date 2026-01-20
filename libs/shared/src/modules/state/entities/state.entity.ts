import { SqlSchema } from '@lib/sql/utils/schema';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { BelongsTo, Column, ForeignKey, Table } from 'sequelize-typescript';
import { Country } from '../../country/entities/country.entity';

@Table
export class State extends SqlSchema {
  @Column
  @ApiProperty({
    description: 'State Name',
    example: 'California',
  })
  @IsString()
  declare name: string;

  @Column
  @ApiProperty({
    description: 'State Code',
    example: 'CA',
  })
  @IsString()
  declare code: string;

  @ForeignKey(() => Country)
  @Column
  @ApiProperty({
    description: 'Country ID',
    example: 1,
  })
  @IsNumber()
  declare country_id: number;

  @BelongsTo(() => Country)
  declare country?: Country;
}
