import { MongoBelongsTo, MongoHasMany } from '@lib/mongo/decorators/populate';
import {
  createMongoSchema,
  defaultSchemaOptions,
  MongoSchema,
} from '@lib/mongo/utils/schema';
import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { Country } from '../../country/entities/country.entity';

export type StateDocument = HydratedDocument<State>;

@Schema({
  ...defaultSchemaOptions,
})
export class State extends MongoSchema {
  @Prop()
  @ApiProperty({
    description: 'State Name',
    example: 'California',
  })
  @IsString()
  name: string;

  @Prop()
  @ApiProperty({
    description: 'State Code',
    example: 'CA',
  })
  @IsString()
  code: string;

  @Prop({ type: Types.ObjectId, ref: Country.name })
  @ApiProperty({
    description: 'Country ID',
    example: '507f1f77bcf86cd799439011',
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  country_id: Types.ObjectId;

  @MongoBelongsTo(Country.name, 'country_id')
  @ApiProperty({
    description: 'Country relation',
    type: () => Country,
  })
  country: Country;

  @MongoHasMany('City', 'state_id')
  @ApiProperty({
    description: 'Cities relation',
    type: () => Array,
    required: false,
  })
  cities?: unknown[];
}
export const StateSchema = createMongoSchema(State);
