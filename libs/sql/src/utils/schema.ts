import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  Model,
  UpdatedAt,
} from 'sequelize-typescript';

/**
 * Options for delete operations in SQL.
 */
export interface DeleteOptions {
  /** Force permanent deletion (hard delete) */
  force?: boolean;
  /** ID of the user who performed the deletion */
  deletedBy?: number | string;
}

/**
 * Options for restore operations in SQL.
 */
export interface RestoreOptions {
  /** ID of the user who performed the restoration */
  restoredBy?: number | string;
}

/**
 * Base schema class for SQL models using Sequelize.
 * Provides common fields and functionality for all models including:
 * - Unique identifiers
 * - Active/inactive state management
 * - Audit trail (created/updated timestamps and user tracking)
 * - Soft delete functionality (paranoid mode)
 *
 * This class should be extended by all SQL model schemas in the application.
 */
export abstract class SqlSchema extends Model {
  @ApiProperty({
    description: 'ID',
    example: 1,
    readOnly: true,
  })
  /** Primary key for the model */
  declare id: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  })
  @ApiProperty({
    description: 'Is Active?',
    example: true,
    required: false,
  })
  /** Indicates if the record is active/enabled */
  declare active: boolean;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  @ApiProperty({
    format: 'date-time',
    description: 'Created At',
    example: '2021-01-01T00:00:00Z',
    readOnly: true,
  })
  /** Timestamp when the record was created */
  declare created_at: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'created_by',
  })
  @ApiProperty({
    description: 'Created By',
    example: 1,
    readOnly: true,
  })
  /** ID of the user who created this record */
  declare created_by: number | string | null;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  @ApiProperty({
    format: 'date-time',
    description: 'Updated At',
    example: '2021-01-01T00:00:00Z',
    readOnly: true,
  })
  /** Timestamp when the record was last updated */
  declare updated_at: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'updated_by',
  })
  @ApiProperty({
    description: 'Updated By',
    example: 1,
    readOnly: true,
  })
  /** ID of the user who last updated this record */
  declare updated_by: number | string | null;

  @DeletedAt
  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'deleted_at',
  })
  @ApiProperty({
    format: 'date-time',
    description: 'Deleted At',
    example: '2021-01-01T00:00:00Z',
    readOnly: true,
  })
  /** Timestamp when the record was soft deleted */
  declare deleted_at: Date | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'deleted_by',
  })
  @ApiProperty({
    description: 'Deleted By',
    example: 1,
    readOnly: true,
  })
  /** ID of the user who soft deleted this record */
  declare deleted_by: number | string | null;
}

/**
 * Type definition for SQL model instances.
 */
export type SqlModelInstance<T> = SqlSchema & T;
