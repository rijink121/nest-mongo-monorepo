import { Type } from '@nestjs/common';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { defaultEngine } from '@shared/config/app.config';
import { AppEngine } from '@shared/constants/app.contants';
import { Type as TransformType } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import {
  Aggregate,
  Document,
  FilterQuery,
  Model,
  Schema,
  SchemaOptions,
  SchemaTypes,
  Types,
} from 'mongoose';
import { getPopulates } from '../decorators/populate';
import { DeleteOptions, RestoreOptions } from '../definitions';

export const getIdType =
  defaultEngine === AppEngine.Mongo ? SchemaTypes.ObjectId : Number;

/**
 * Sets up virtual populate fields on the schema based on decorators.
 */
const setVirtualPopulates = <T extends MongoSchema>(
  model: Type<T>,
  schema: Schema,
): void => {
  const populates = getPopulates(model);
  populates.forEach((populate) => {
    schema.virtual(populate.name, populate.options);
  });
};

/**
 * Adds default query hooks for soft delete filtering on find and aggregate operations.
 */
const setDefaultHooks = (schema: Schema): void => {
  schema.pre(
    [
      'countDocuments',
      'find',
      'findOne',
      'findOneAndDelete',
      'findOneAndReplace',
      'findOneAndUpdate',
    ],
    function () {
      const option = this.getOptions() || {};
      if (option.onlyDeleted) {
        this.where({ deleted: true });
      } else if (!option.withDeleted) {
        this.where({ deleted: false });
      }
    },
  );

  schema.pre('aggregate', function (this: Aggregate<unknown>) {
    const option = this.options;
    if (option.onlyDeleted) {
      this.pipeline().unshift({ $match: { deleted: true } });
    } else if (!option.withDeleted) {
      this.pipeline().unshift({ $match: { deleted: false } });
    }
  });
};

/**
 * Adds default instance methods for soft delete and restore functionality.
 */
const setDefaultMethods = (schema: Schema): void => {
  schema.method({
    /**
     * Soft deletes the document or force deletes if specified.
     */
    delete: function <T extends MongoSchema>(
      this: Document<T>,
      options: DeleteOptions = {},
    ): Promise<Document<T> | null> {
      if (options.force) {
        return this.deleteOne() as Promise<Document<T> | null>;
      } else {
        this.set('deleted', true);
        this.set('deleted_at', new Date());
        if (options.deletedBy) {
          this.set('deleted_by', options.deletedBy);
          this.set('updated_by', options.deletedBy);
        }
        return this.save();
      }
    },

    /**
     * Restores a soft deleted document.
     */
    restore: function <T extends MongoSchema>(
      this: Document<T>,
      options: RestoreOptions = {},
    ): Promise<Document<T>> {
      this.set('deleted', false);
      this.set('deleted_at', undefined);
      this.set('deleted_by', undefined);
      if (options.restoredBy) {
        this.set('updated_by', options.restoredBy);
      }
      return this.save();
    },
  });
};

/**
 * Adds static methods for bulk soft delete operations.
 */
const setDefaultStaticMethods = (schema: Schema): void => {
  schema.static({
    /**
     * Bulk soft deletes documents matching the filter, or force deletes if specified.
     */
    bulkDelete: function <T extends MongoSchema>(
      this: Model<T>,
      filter: FilterQuery<T>,
      options: DeleteOptions = {},
    ) {
      if (options.force) {
        return this.deleteMany(filter);
      } else {
        const update: Partial<MongoSchema> = {
          deleted: true,
          deleted_at: new Date(),
        };
        if (options.deletedBy) {
          update.deleted_by = options.deletedBy;
          update.updated_by = options.deletedBy;
        }
        return this.updateMany(filter, update);
      }
    },
  });
};

/**
 * Creates a Mongoose schema for the given model with default hooks, methods, and virtuals.
 */
export const createMongoSchema = <T extends MongoSchema>(model: Type<T>) => {
  const schema = SchemaFactory.createForClass(model);
  setVirtualPopulates(model, schema);
  setDefaultHooks(schema);
  setDefaultMethods(schema);
  setDefaultStaticMethods(schema);
  return schema;
};

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
  @TransformType(() => Boolean)
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
