import { MongoHasMany } from '@lib/mongo/decorators/populate';
import {
  createMongoSchema,
  defaultSchemaOptions,
  MongoSchema,
} from '@lib/mongo/utils/schema';
import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { HydratedDocument } from 'mongoose';

export type CountryDocument = HydratedDocument<Country>;

@Schema({
  ...defaultSchemaOptions,
})
export class Country extends MongoSchema {
  @Prop()
  @ApiProperty({
    description: 'Country Name',
    example: 'United States',
  })
  @IsString()
  name: string;

  @Prop()
  @ApiProperty({
    description: 'Country Code (ISO 3166-1 alpha-2)',
    example: 'US',
  })
  @IsString()
  code: string;

  @MongoHasMany('State', 'country_id')
  @ApiProperty({
    description: 'States relation',
    type: () => Array,
    required: false,
  })
  states?: unknown[];
}
export const CountrySchema = createMongoSchema(Country);
