import {
  createMongoSchema,
  defaultSchemaOptions,
  MongoSchema,
} from '@lib/mongo/utils/schema';
import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema({
  collection: 'session',
  ...defaultSchemaOptions,
})
export class Session extends MongoSchema {
  @Prop()
  @ApiProperty({ description: 'User ID', example: '1' })
  user_id: string;

  @Prop()
  @ApiProperty({
    description: 'Refresh Token',
    example: 'e9e93e0a5acfb6358c7c9fd91579b048d40574a',
  })
  token: string;

  @Prop()
  @ApiProperty({
    format: 'date-time',
    description: 'Token Expiry',
    example: '2021-01-01T00:00:00Z',
  })
  token_expiry: Date;

  @Prop({ default: Date.now })
  @ApiProperty({
    format: 'date-time',
    description: 'Login At',
    example: '2021-01-01T00:00:00Z',
  })
  login_at: Date;

  @Prop()
  @ApiProperty({
    format: 'date-time',
    description: 'Logout At',
    example: '2021-01-01T00:00:00Z',
  })
  logout_at: Date;

  @Prop({ type: 'Mixed' })
  @ApiProperty({ description: 'Info' })
  info: Record<string, unknown>;
}
export const SessionSchema = createMongoSchema(Session);
