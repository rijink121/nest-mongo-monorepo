import {
  createMongoSchema,
  defaultSchemaOptions,
  MongoSchema,
} from '@lib/mongo/utils/schema';
import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export enum OtpSessionType {
  Login = 'Login',
  Signup = 'Signup',
  Forgot = 'Forgot',
}

export type OtpSessionDocument = HydratedDocument<OtpSession>;

@Schema({
  ...defaultSchemaOptions,
})
export class OtpSession extends MongoSchema {
  @Prop()
  @ApiProperty({ description: 'User ID', example: 1 })
  user_id: number;

  @Prop()
  @ApiProperty({ description: 'OTP', example: '123456' })
  otp: string;

  @Prop({ enum: OtpSessionType })
  @ApiProperty({
    description: 'Type',
    example: OtpSessionType.Forgot,
    enum: OtpSessionType,
  })
  type: OtpSessionType;

  @Prop({ default: false })
  @ApiProperty({ description: 'Verified?', example: false })
  verified: boolean;

  @Prop({ default: 3 })
  @ApiProperty({ description: 'Retry Limit', example: 3 })
  retry_limit: number;

  @Prop({ default: 2 })
  @ApiProperty({ description: 'Resend Limit', example: 2 })
  resend_limit: number;

  @Prop()
  @ApiProperty({
    format: 'date-time',
    description: 'Expire At',
    example: '2021-01-01T00:00:00Z',
  })
  expire_at: Date;

  @Prop({ type: 'Mixed' })
  @ApiProperty({ description: 'Other Infos' })
  payload: Record<string, unknown>;
}
export const OtpSessionSchema = createMongoSchema(OtpSession);
