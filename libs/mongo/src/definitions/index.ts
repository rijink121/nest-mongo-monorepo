import { Document, FilterQuery, HydratedDocument, Types } from 'mongoose';

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

/**
 * Composite type that combines Mongoose Document with MongoSchema base fields,
 * custom type T, and default schema methods for a fully-featured document type.
 *
 * @template T - The custom schema interface or class
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   email: string;
 * }
 *
 * type UserDocument = MongoDocument<User>;
 * // Results in: Document & MongoSchema & User & DefaultSchemaMethods
 * ```
 */
export type MongoDocument<T> = Document &
  MongoSchema &
  T &
  DefaultSchemaMethods;

/**
 * Wrapper type for hydrated MongoDB documents with full type safety.
 * Provides a more convenient alias for working with hydrated documents
 * that include all base schema functionality.
 *
 * @template T - The custom schema interface or class
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   email: string;
 * }
 *
 * type UserModel = ModelWrap<User>;
 * // Results in: HydratedDocument<MongoDocument<User>>
 * ```
 */
export type ModelWrap<T> = HydratedDocument<MongoDocument<T>>;
