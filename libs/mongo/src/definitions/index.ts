import { FilterQuery, HydratedDocument, Types } from 'mongoose';
import { MongoSchema } from '../utils/schema';

/**
 * Options for soft delete operations.
 * Allows for forced deletion and tracking who performed the deletion.
 */
export interface DeleteOptions {
  /** Force permanent deletion (hard delete) */
  force?: boolean;
  /** ID of the user who performed the deletion */
  deletedBy?: number | Types.ObjectId;
}

/**
 * Options for restore operations.
 * Allows tracking who performed the restoration.
 */
export interface RestoreOptions {
  /** ID of the user who performed the restoration */
  restoredBy?: number | Types.ObjectId;
}

/**
 * Instance methods available on all schema documents.
 * Provides soft delete and restore functionality.
 */
export interface DefaultSchemaMethods {
  /** Soft delete this document with optional parameters */
  delete(options?: DeleteOptions): Promise<this>;
  /** Restore a soft-deleted document with optional parameters */
  restore(options?: RestoreOptions): Promise<this>;
}

/**
 * Static methods available on all schema models.
 * Provides bulk operations for collections.
 */
export interface DefaultSchemaStaticMethods<T> {
  /** Bulk soft delete documents matching the filter */
  bulkDelete(
    filter?: FilterQuery<T>,
    options?: DeleteOptions,
  ): Promise<unknown>;
}

export type MongoDocument<T> = Document &
  MongoSchema &
  T &
  DefaultSchemaMethods;
export type ModelWrap<T> = HydratedDocument<MongoDocument<T>>;
