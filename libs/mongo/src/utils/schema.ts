import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { SchemaOptions, Types } from 'mongoose';
import { getIdType } from '.';

/**
 * Default schema options for consistent MongoDB document behavior.
 * Configures timestamps and JSON/Object transformation settings.
 */
export const defaultSchemaOptions: SchemaOptions = {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
};

/**
 * Base schema class for MongoDB documents.
 * Provides common fields and functionality for all schemas including:
 * - Unique identifiers
 * - Active/inactive state management
 * - Audit trail (created/updated timestamps and user tracking)
 * - Soft delete functionality
 *
 * This class should be extended by all MongoDB document schemas in the application.
 */
export class MongoSchema {
  /** MongoDB ObjectId for the document */
  _id: Types.ObjectId;

  @ApiProperty({
    description: 'ID as String',
    readOnly: true,
  })
  /** String representation of the document ID */
  id: string;

  @Prop({
    default: true,
  })
  @ApiProperty({
    description: 'Is Active?',
    example: true,
    required: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  /** Indicates if the document is active/enabled */
  active: boolean;

  @ApiProperty({
    format: 'date-time',
    description: 'Created At',
    example: '2021-01-01T00:00:00Z',
    readOnly: true,
  })
  /** Timestamp when the document was created */
  created_at: Date;

  @Prop({
    type: getIdType,
    default: null,
  })
  @ApiProperty({
    description: 'Created By',
    example: '606d990740d3ba3480dae119',
    readOnly: true,
  })
  /** ID of the user who created this document */
  created_by: number | string;

  @ApiProperty({
    format: 'date-time',
    description: 'Updated At',
    example: '2021-01-01T00:00:00Z',
    readOnly: true,
  })
  /** Timestamp when the document was last updated */
  updated_at: Date;

  @Prop({
    type: getIdType,
    default: null,
  })
  @ApiProperty({
    description: 'Updated By',
    example: '606d990740d3ba3480dae119',
    readOnly: true,
  })
  /** ID of the user who last updated this document */
  updated_by: number | Types.ObjectId;

  @Prop({
    type: Boolean,
    default: false,
  })
  /** Indicates if the document has been soft deleted */
  deleted: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  @ApiProperty({
    format: 'date-time',
    description: 'Deleted At',
    example: '2021-01-01T00:00:00Z',
    readOnly: true,
  })
  /** Timestamp when the document was soft deleted */
  deleted_at: Date;

  @Prop({
    type: getIdType,
  })
  @ApiProperty({
    description: 'Deleted By',
    example: '606d990740d3ba3480dae119',
    readOnly: true,
  })
  /** ID of the user who soft deleted this document */
  deleted_by: number | Types.ObjectId;
}
