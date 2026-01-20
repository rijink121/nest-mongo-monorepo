import { SqlSchema } from '@lib/sql/utils/schema';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { BelongsTo, Column, ForeignKey, Table } from 'sequelize-typescript';
import { State } from '../../state/entities/state.entity';

@Table
export class City extends SqlSchema {
  @Column
  @ApiProperty({
    description: 'City Name',
    example: 'Los Angeles',
  })
  @IsString()
  declare name: string;

  @Column
  @ApiProperty({
    description: 'City Code',
    example: 'LA',
  })
  @IsString()
  declare code: string;

  @ForeignKey(() => State)
  @Column
  @ApiProperty({
    description: 'State ID',
    example: 1,
  })
  @IsNumber()
  declare state_id: number;

  @BelongsTo(() => State)
  declare state: State;
}
