import { MongoBelongsTo } from '@lib/mongo/decorators/populate';
import {
  createMongoSchema,
  defaultSchemaOptions,
  MongoSchema,
} from '@lib/mongo/utils/schema';
import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { State } from '../../state/entities/state.entity';

export type CityDocument = HydratedDocument<City>;

@Schema({
  ...defaultSchemaOptions,
})
export class City extends MongoSchema {
  @Prop()
  @ApiProperty({
    description: 'City Name',
    example: 'Los Angeles',
  })
  @IsString()
  name: string;

  @Prop()
  @ApiProperty({
    description: 'City Code',
    example: 'LA',
  })
  @IsString()
  code: string;

  @Prop({ type: Types.ObjectId, ref: State.name })
  @ApiProperty({
    description: 'State ID',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  state_id?: Types.ObjectId;

  @MongoBelongsTo(State.name, 'state_id')
  @ApiProperty({
    description: 'State relation',
    type: () => State,
    required: false,
  })
  state?: State;
}
export const CitySchema = createMongoSchema(City);
