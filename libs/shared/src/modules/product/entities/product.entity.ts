import {
  createMongoSchema,
  defaultSchemaOptions,
  MongoSchema,
} from '@lib/mongo/utils/schema';
import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  collection: 'product',
  ...defaultSchemaOptions,
})
export class Product extends MongoSchema {
  @Prop()
  @ApiProperty({
    description: 'Product Name',
    example: 'Product Name',
  })
  @IsString()
  name: string;
}
export const ProductSchema = createMongoSchema(Product);
