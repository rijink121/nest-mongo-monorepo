import { CachingService } from '@core/modules/caching/caching.service';
import { addDays, snakeCase } from '@core/utils';
import { NotFoundError } from '@core/utils/error';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { History } from '@shared/modules/history/entities/history.entity';
import { Trash } from '@shared/modules/trash/entities/trash.entity';
import { Connection, Document, HydratedDocument, Model, Types } from 'mongoose';
import {
  DefaultSchemaMethods,
  DefaultSchemaStaticMethods,
  SoftDeleteQueryOptions,
} from './definitions';
import type { MongoModelOption } from './mongo.module';
import {
  MongoCountResponse,
  MongoCreateBulkResponse,
  MongoCreateResponse,
  MongoDeleteOneResponse,
  MongoDeleteResponse,
  MongoGetAllResponse,
  MongoGetOneResponse,
  MongoJob,
  MongoResponse,
  MongoUpdateResponse,
} from './utils/job';
import { MongoSchema } from './utils/schema';

/**
 * Type representing a Mongo document with default schema methods.
 * Combines Mongoose Document, custom MongoSchema, the generic type T, and default schema methods.
 */
export type MongoDocument<T> = Document &
  MongoSchema &
  T &
  DefaultSchemaMethods;

/**
 * Hydrated document type wrapper for Mongo documents.
 * Represents a fully populated document instance with all virtuals and methods.
 */
export type ModelWrap<T> = HydratedDocument<MongoDocument<T>>;

/**
 * Mongo model type with static methods.
 * Extends the Mongoose Model with custom static methods for enhanced functionality.
 */
export type MongoModel<T> = Model<MongoDocument<T>> &
  DefaultSchemaStaticMethods<MongoDocument<T>>;

/**
 * Generic MongoDB service providing CRUD operations and advanced features.
 *
 * This service acts as a base class for all MongoDB operations, providing:
 * - Standard CRUD operations (create, read, update, delete)
 * - Bulk operations for multiple records
 * - Soft delete and restore functionality
 * - History tracking for audit trails
 * - Trash management for hard-deleted records
 * - Cache management with tag-based invalidation
 * - Sub-document operations
 * - Aggregation support
 *
 * @template M - The schema type extending MongoSchema
 */
@Injectable()
export class MongoService<M extends MongoSchema> {
  /** The Mongoose model instance for this service */
  private readonly model: MongoModel<M>;

  constructor(
    @Inject('MODEL_NAME') private readonly modelName: string,
    @Inject('MODEL_OPTIONS') private readonly options: MongoModelOption,
    @InjectConnection() private readonly connection: Connection,
    private readonly cachingService: CachingService,
    private readonly _config: ConfigService,
  ) {
    // Get the model instance from the connection
    this.model = connection.models[modelName] as MongoModel<M>;
  }

  // =========================================================================
  // Private Helper Methods
  // =========================================================================

  /**
   * Add a record to the history collection asynchronously.
   * This creates an audit trail for data changes without blocking the main operation.
   *
   * @param history - Partial history record containing action details
   * @private
   */
  private addToHistory(history: Partial<History>): void {
    this.connection.models.History.create({
      entity: this.modelName,
      expire_in: this.options.historyExpireIn
        ? addDays(this.options.historyExpireIn)
        : null,
      ...history,
    }).catch((err) => {
      // Log error but don't block main process
      console.error('Error creating history record', err);
    });
  }

  /**
   * Add a record to the trash collection asynchronously.
   * This preserves hard-deleted data for potential recovery without blocking the main operation.
   *
   * @param trash - Partial trash record containing deleted data
   * @private
   */
  private addToTrash(trash: Partial<Trash>): void {
    this.connection.models.Trash.create({
      entity: this.modelName,
      expire_in: this.options.trashExpireIn
        ? addDays(this.options.trashExpireIn)
        : null,
      ...trash,
    }).catch((err) => {
      // Log error but don't block main process
      console.error('Error creating trash record', err);
    });
  }

  /**
   * Clear the cache for the model using configured cache tags.
   * This invalidates all cached entries associated with this model.
   *
   * @private
   */
  private async clearCache(): Promise<void> {
    const tags = this.options.cacheTags || [snakeCase(this.modelName)];
    for (const tag of tags) {
      await this.cachingService.clearTag(tag);
    }
  }

  // =========================================================================
  // Create Operations
  // =========================================================================

  /**
   * Create a new record in the database.
   *
   * Features:
   * - Automatic owner tracking (created_by, updated_by)
   * - Optional history logging
   * - Automatic cache invalidation
   * - Optional population of referenced documents
   *
   * @param job - Job configuration containing body, owner, options, and history flag
   * @returns Promise resolving to the created record or error
   */
  async createRecord(job: MongoJob<M>): Promise<MongoCreateResponse<M>> {
    try {
      const { body, owner, options = {}, history = true } = job;

      // Validate required parameters
      if (typeof body === 'undefined') {
        return {
          error: 'Error calling createRecord - body is missing',
        };
      }

      // Create new document instance
      let data = new this.model(body);

      // Set owner information if provided
      if (owner?.id) {
        data.set('created_by', owner.id);
        data.set('updated_by', owner.id);
      }

      // Save the document
      await data.save();

      // Add to history if enabled
      if (this.options.history && history) {
        this.addToHistory({
          entity_id: data._id,
          action: 'create',
          created: true,
          data: data.toJSON(),
          created_by: owner?.id,
        });
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      // Populate referenced documents if requested
      const { populate } = options;
      if (populate) {
        data = await data.populate(populate);
      }

      return { data, created: true };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Create multiple records in a single bulk operation.
   *
   * Features:
   * - Efficient batch insertion
   * - Automatic owner tracking for all records
   * - Individual history logging for each record
   * - Automatic cache invalidation
   *
   * @param job - Job configuration containing records array, owner, options, and history flag
   * @returns Promise resolving to array of created records or error
   */
  async createBulkRecords(
    job: MongoJob<M>,
  ): Promise<MongoCreateBulkResponse<M>> {
    try {
      const { records = [], owner, options = {}, history = true } = job;

      // Validate required parameters
      if (!records.length) {
        return {
          error: 'Error calling createBulkRecord - records are missing',
        };
      }

      // Set owner information for all records if provided
      if (owner?.id) {
        records.forEach((record) => {
          record.created_by = owner.id;
          record.updated_by = owner.id;
        });
      }

      // Perform bulk create operation
      const data = await this.model.create(records, options);

      // Add each record to history if enabled
      if (this.options.history && history) {
        data.forEach((item) => {
          this.addToHistory({
            entity_id: item._id,
            action: 'create',
            created: true,
            data: item.toJSON(),
            created_by: owner?.id,
          });
        });
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  // =========================================================================
  // Update Operations
  // =========================================================================

  /**
   * Update a single record by its primary key.
   *
   * Features:
   * - Find by ID with custom primary key support
   * - Optional document reuse (skip fetch if document already provided)
   * - Automatic owner tracking (updated_by)
   * - History logging with previous data snapshot
   * - Automatic cache invalidation
   * - Optional population of referenced documents
   * - Optional ignore not found errors
   *
   * @param job - Job configuration containing id, body, owner, pk, options, and history flag
   * @returns Promise resolving to updated record with previous data or error
   */
  async updateRecord(job: MongoJob<M>): Promise<MongoUpdateResponse<M>> {
    try {
      const {
        id,
        body = {},
        owner,
        pk = '_id',
        options = {},
        history = true,
      } = job;

      // Validate required parameters
      if (!id) {
        return { error: 'Error calling updateRecord - id is missing' };
      }
      if (typeof body === 'undefined') {
        return {
          error: 'Error calling updateRecord - body is missing',
        };
      }

      const {
        where = {},
        projection,
        populate,
        ignoreNotFound = false,
        document,
      } = options;

      // Use provided document or fetch from database
      let data = document;
      if (!data) {
        data = await this.model.findOne(
          {
            ...where,
            [pk]: job.id,
          },
          projection,
          options,
        );

        if (data === null && !ignoreNotFound) {
          throw new NotFoundError('Record not found');
        }
      }

      // Handle case where record doesn't exist
      if (!data) {
        return { data };
      }

      // Capture previous state before update
      const previousData = data.toJSON();

      // Apply updates to document
      for (const prop in body) {
        data.set(prop, body[prop]);
        data.markModified(prop);
      }

      // Set owner information if provided
      if (owner?.id) {
        data.set('updated_by', owner.id);
      }

      // Save the updated document
      await data.save();

      // Add to history if enabled
      if (this.options.history && history) {
        this.addToHistory({
          entity_id: data._id,
          action: 'update',
          data: data.toJSON(),
          previous_data: previousData,
          created_by: owner?.id,
        });
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      // Populate referenced documents if requested
      if (populate) {
        data = await data.populate(populate);
      }

      return { data, previousData };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Find and update a record by custom query conditions.
   *
   * Features:
   * - Find by custom where conditions (not just ID)
   * - Automatic owner tracking (updated_by)
   * - History logging with previous data snapshot
   * - Automatic cache invalidation
   * - Optional ignore not found errors
   *
   * @param job - Job configuration containing body, owner, options (with where clause), and history flag
   * @returns Promise resolving to updated record with previous data or error
   */
  async findAndUpdateRecord(job: MongoJob<M>): Promise<MongoUpdateResponse<M>> {
    try {
      const { body, owner, options = {}, history = true } = job;

      // Validate required parameters
      if (typeof body === 'undefined') {
        return {
          error: 'Error calling findAndUpdateRecord - body is missing',
        };
      }
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling findAndUpdateRecord - options.where is missing',
        };
      }

      const { where = {}, projection, ignoreNotFound = false } = options;

      // Find the document
      const data = await this.model.findOne(where, projection, options);

      if (data === null && !ignoreNotFound) {
        throw new NotFoundError('Record not found');
      }

      // Handle case where record doesn't exist
      if (!data) {
        return { data };
      }

      // Capture previous state before update
      const previousData = data.toJSON();

      // Apply updates to document
      for (const prop in body) {
        data.set(prop, body[prop]);
        data.markModified(prop);
      }

      // Set owner information if provided
      if (owner?.id) {
        data.set('updated_by', owner.id);
      }

      // Save the updated document
      await data.save();

      // Add to history if enabled
      if (this.options.history && history) {
        this.addToHistory({
          entity_id: data._id,
          action: 'update',
          data: data.toJSON(),
          previous_data: previousData,
          created_by: owner?.id,
        });
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      return { data, previousData };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Update multiple records in a single bulk operation.
   *
   * Features:
   * - Efficient batch update using updateMany
   * - Automatic owner tracking (updated_by)
   * - Automatic cache invalidation
   * - Note: Does not log individual history entries for performance
   *
   * @param job - Job configuration containing body, owner, and options (with where clause)
   * @returns Promise resolving to update result or error
   */
  async updateBulkRecords(job: MongoJob<M>): Promise<MongoResponse> {
    try {
      const { body, owner, options = {} } = job;

      // Validate required parameters
      if (typeof body === 'undefined') {
        return {
          error: 'Error calling updateBulkRecords - body is missing',
        };
      }
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling updateBulkRecords - options.where is missing',
        };
      }

      // Set owner information if provided
      if (owner?.id) {
        body.updated_by = owner.id;
      }

      const { where = {} } = options;

      // Perform bulk update operation
      const data = await this.model.updateMany(where, body);

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  // =========================================================================
  // Read Operations
  // =========================================================================

  /**
   * Retrieve all records with optional pagination.
   *
   * Features:
   * - Optional pagination with offset/limit
   * - Total count calculation when pagination is enabled
   * - Configurable default and maximum limits
   * - Custom query conditions and projections
   *
   * @param job - Job configuration containing options (where, projection, pagination, limit, skip)
   * @returns Promise resolving to array of records with optional pagination metadata or error
   */
  async getAllRecords(job: MongoJob<M>): Promise<MongoGetAllResponse<M>> {
    try {
      const { options = {} } = job;
      const { where = {}, projection, pagination = false } = options;

      // Set limit based on configuration or provided value
      options.limit = options.limit
        ? options.limit === -1
          ? this._config.get('paginationMaxLimit')
          : options.limit
        : this._config.get('paginationLimit');

      // Handle paginated vs non-paginated requests
      if (pagination) {
        // Fetch data and count in parallel for better performance
        const [data, count] = await Promise.all([
          this.model.find(where, projection, options),
          this.model.countDocuments(where, {
            withDeleted: true,
          } as SoftDeleteQueryOptions),
        ]);

        return {
          data,
          offset: options.skip,
          limit: options.limit,
          count,
        };
      } else {
        // Simple list without pagination metadata
        const data = await this.model.find(where, projection, options);
        return {
          data: data,
        };
      }
    } catch (error) {
      return { error };
    }
  }

  /**
   * Get the total count of records matching query conditions.
   *
   * @param job - Job configuration containing options (with where clause)
   * @returns Promise resolving to count number or error
   */
  async countAllRecords(job: MongoJob<M>): Promise<MongoCountResponse> {
    try {
      const { where = {} } = job.options || {};
      const data = await this.model.countDocuments(where);
      return { count: data };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Find a single record by its primary key.
   *
   * Features:
   * - Custom primary key support (default: _id)
   * - Additional where conditions
   * - Custom projection
   * - Optional allow empty result
   *
   * @param job - Job configuration containing id, pk, and options
   * @returns Promise resolving to found record or error
   */
  async findRecordById(job: MongoJob<M>): Promise<MongoGetOneResponse<M>> {
    try {
      const { id, pk = '_id', options = {} } = job;

      // Validate required parameters
      if (!id) {
        return { error: 'Error calling findRecordById - id is missing' };
      }

      const { where = {}, projection, allowEmpty } = options;

      // Find the document
      const data = await this.model.findOne(
        { ...where, [pk]: id },
        projection,
        options,
      );

      if (data === null && !allowEmpty) {
        throw new NotFoundError('Record not found');
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Find a single record by custom query conditions.
   *
   * Features:
   * - Custom where conditions
   * - Custom projection
   * - Optional allow empty result
   *
   * @param job - Job configuration containing options (with where clause)
   * @returns Promise resolving to found record or error
   */
  async findOneRecord(job: MongoJob<M>): Promise<MongoGetOneResponse<M>> {
    try {
      const { options = {} } = job;

      // Validate required parameters
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling findOneRecord - options.where is missing',
        };
      }

      const { where = {}, projection, allowEmpty } = options;

      // Find the document
      const data = await this.model.findOne(where, projection, options);

      if (data === null && !allowEmpty) {
        throw new NotFoundError('Record not found');
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  // =========================================================================
  // Sub-Document Operations
  // =========================================================================

  /**
   * Add a sub-document to an array field in a record.
   *
   * Features:
   * - Add new sub-document to array field
   * - Automatic owner tracking (updated_by)
   * - History logging with previous data snapshot
   * - Automatic cache invalidation
   * - Optional population of referenced documents
   *
   * @param job - Job configuration containing id, body, owner, pk, options, and history flag
   * @returns Promise resolving to updated record with previous data or error
   */
  async addSubDocument(job: MongoJob<M>): Promise<MongoUpdateResponse<M>> {
    try {
      const {
        id,
        pk = '_id',
        body = {},
        options = {},
        history = true,
        owner,
      } = job;

      // Validate required parameters
      if (!id) {
        return { error: 'Error calling addSubDocument - id is missing' };
      }

      const { subDocumentField, where = {}, projection, populate } = options;

      if (!subDocumentField) {
        return {
          error:
            'Error calling addSubDocument - options.subDocumentField is missing',
        };
      }

      // Find the parent document
      let data = await this.model.findOne(
        {
          ...where,
          [pk]: id,
        },
        projection,
        options,
      );

      if (data === null) {
        throw new NotFoundError('Record not found');
      }

      // Capture previous state before update
      const previousData = data.toJSON();

      // Add sub-document to array field
      (data[subDocumentField] as Types.DocumentArray<unknown>).push(body);

      // Set owner information if provided
      if (owner?.id) {
        data.set('updated_by', owner.id);
      }

      // Save the updated document
      await data.save();

      // Add to history if enabled
      if (this.options.history && history) {
        this.addToHistory({
          entity_id: data._id,
          action: 'update',
          data: data.toJSON(),
          previous_data: previousData,
          created_by: owner?.id,
        });
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      // Populate referenced documents if requested
      if (populate) {
        data = await data.populate(populate);
      }

      return { data, previousData };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Remove a sub-document from an array field in a record.
   *
   * Features:
   * - Remove sub-document from array field by ID
   * - Automatic owner tracking (updated_by)
   * - History logging with previous data snapshot
   * - Automatic cache invalidation
   * - Optional population of referenced documents
   *
   * @param job - Job configuration containing id, pk, options, history flag, and owner
   * @returns Promise resolving to updated record with previous data or error
   */
  async removeSubDocument(job: MongoJob<M>): Promise<MongoUpdateResponse<M>> {
    try {
      const { id, pk = '_id', options = {}, history = true, owner } = job;

      // Validate required parameters
      if (!id) {
        return { error: 'Error calling removeSubDocument - id is missing' };
      }

      const {
        subDocumentField,
        subDocumentId,
        where = {},
        projection,
        populate,
      } = options;

      if (!subDocumentField) {
        return {
          error:
            'Error calling removeSubDocument - options.subDocumentField is missing',
        };
      }

      if (!subDocumentId) {
        return {
          error:
            'Error calling removeSubDocument - options.subDocumentId is missing',
        };
      }

      // Find the parent document
      let data = await this.model.findOne(
        {
          ...where,
          [pk]: job.id,
        },
        projection,
        options,
      );

      if (data === null) {
        throw new NotFoundError('Record not found');
      }

      // Capture previous state before update
      const previousData = data.toJSON();

      // Remove sub-document from array field
      (data[subDocumentField] as Types.DocumentArray<unknown>).pull(
        subDocumentId,
      );

      // Set owner information if provided
      if (owner?.id) {
        data.set('updated_by', owner.id);
      }

      // Save the updated document
      await data.save();

      // Add to history if enabled
      if (this.options.history && history) {
        this.addToHistory({
          entity_id: data._id,
          action: 'update',
          data: data.toJSON(),
          previous_data: previousData,
          created_by: owner?.id,
        });
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      // Populate referenced documents if requested
      if (populate) {
        data = await data.populate(populate);
      }

      return { data, previousData };
    } catch (error) {
      return { error };
    }
  }

  // =========================================================================
  // Upsert Operations (Find or Create / Create or Update)
  // =========================================================================

  /**
   * Find an existing record or create a new one if not found.
   *
   * Features:
   * - Atomic find-or-create operation
   * - Returns existing record without modification
   * - Creates new record only if not found
   * - Automatic owner tracking for new records
   * - History logging for creation
   * - Automatic cache invalidation on creation
   *
   * @param job - Job configuration containing body, owner, options (with where clause), and history flag
   * @returns Promise resolving to found/created record with created flag or error
   */
  async findOrCreate(job: MongoJob<M>): Promise<MongoCreateResponse<M>> {
    try {
      const { body = {}, options = {}, history = true, owner } = job;

      // Validate required parameters
      if (typeof body === 'undefined') {
        return {
          error: 'Error calling findOrCreate - body is missing',
        };
      }
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling findOrCreate - options.where is missing',
        };
      }

      const { where = {}, projection } = options;

      // Try to find existing record
      let data = await this.model.findOne(where, projection, options);
      let created = false;

      // Create new record if not found
      if (data === null) {
        data = new this.model(body);

        // Set owner information if provided
        if (owner?.id) {
          data.set('created_by', owner.id);
          data.set('updated_by', owner.id);
        }

        await data.save();
        created = true;

        // Add to history if enabled
        if (this.options.history && history) {
          this.addToHistory({
            entity_id: data._id,
            action: 'create',
            created,
            data: data.toJSON(),
            created_by: owner?.id,
          });
        }

        // Invalidate cache if enabled
        if (this.options.cache) {
          await this.clearCache();
        }
      }

      return { data, created };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Create a new record or update existing one based on query conditions.
   *
   * Features:
   * - Atomic create-or-update operation
   * - Updates existing record if found
   * - Creates new record if not found
   * - Automatic owner tracking
   * - History logging for both create and update
   * - Automatic cache invalidation
   *
   * @param job - Job configuration containing body, owner, options (with where clause), and history flag
   * @returns Promise resolving to created/updated record with created flag or error
   */
  async createOrUpdate(job: MongoJob<M>): Promise<MongoCreateResponse<M>> {
    try {
      const { body = {}, options = {}, history = true, owner } = job;

      // Validate required parameters
      if (typeof body === 'undefined') {
        return {
          error: 'Error calling createOrUpdate - body is missing',
        };
      }
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling createOrUpdate - options.where is missing',
        };
      }

      const { where = {}, projection } = options;
      let created = false;

      // Try to find existing record
      let data = await this.model.findOne(where, projection, options);

      if (data !== null) {
        // Update existing record
        const previousData = data.toJSON();

        for (const prop in body) {
          data.set(prop, body[prop]);
          data.markModified(prop);
        }

        // Set owner information if provided
        if (owner?.id) {
          data.set('updated_by', owner.id);
        }

        await data.save();

        // Add to history if enabled
        if (this.options.history && history) {
          this.addToHistory({
            entity_id: data._id,
            action: 'update',
            data: data.toJSON(),
            previous_data: previousData,
            created_by: owner?.id,
          });
        }
      } else {
        // Create new record
        data = new this.model(body);

        // Set owner information if provided
        if (owner?.id) {
          data.set('created_by', owner.id);
          data.set('updated_by', owner.id);
        }

        await data.save();
        created = true;

        // Add to history if enabled
        if (this.options.history && history) {
          this.addToHistory({
            entity_id: data._id,
            action: 'create',
            created: true,
            data: data.toJSON(),
            created_by: owner?.id,
          });
        }
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      return { data, created };
    } catch (error) {
      return { error };
    }
  }

  // =========================================================================
  // Delete Operations
  // =========================================================================

  /**
   * Delete a single record by its primary key.
   *
   * Features:
   * - Soft delete by default (can be restored)
   * - Hard delete option (permanently removes record)
   * - Trash collection for hard-deleted records
   * - History logging for soft deletes
   * - Automatic cache invalidation
   * - Custom primary key support
   *
   * @param job - Job configuration containing id, pk, options, owner, and history flag
   * @returns Promise resolving to deleted record or error
   */
  async deleteRecord(job: MongoJob<M>): Promise<MongoDeleteOneResponse<M>> {
    try {
      const { id, pk = '_id', options = {}, owner, history = true } = job;

      // Validate required parameters
      if (!id) {
        return { error: 'Error calling deleteRecord - id is missing' };
      }

      const { where = {}, hardDelete = false } = options;

      // Find the document (including soft-deleted ones if hard delete requested)
      const data = await this.model.findOne(
        {
          ...where,
          [pk]: id,
        },
        null,
        {
          ...options,
          withDeleted: hardDelete,
        },
      );

      if (data === null) {
        throw new NotFoundError('Record not found');
      }

      // Delete the document
      await data.delete({
        force: hardDelete,
        deletedBy: owner?.id,
      });

      // Handle hard delete vs soft delete tracking
      if (hardDelete) {
        // Add to trash for hard deletes
        this.addToTrash({
          entity_id: data._id,
          data: data.toJSON(),
          created_by: owner?.id,
        });
      } else if (this.options.history && history) {
        // Add to history for soft deletes
        this.addToHistory({
          entity_id: data._id,
          action: 'delete',
          data: data.toJSON(),
          created_by: owner?.id,
        });
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Find and delete a record by custom query conditions.
   *
   * Features:
   * - Soft delete by default (can be restored)
   * - Hard delete option (permanently removes record)
   * - Trash collection for hard-deleted records
   * - History logging for soft deletes
   * - Automatic cache invalidation
   *
   * @param job - Job configuration containing options (with where clause), owner, and history flag
   * @returns Promise resolving to deleted record or error
   */
  async findAndDeleteRecord(job: MongoJob<M>): Promise<MongoDeleteResponse<M>> {
    try {
      const { options = {}, owner, history = true } = job;

      // Validate required parameters
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling findAndDeleteRecord - options.where is missing',
        };
      }

      const { where = {}, hardDelete = false } = options;

      // Find the document (including soft-deleted ones if hard delete requested)
      const data = await this.model.findOne(where, null, {
        ...options,
        withDeleted: hardDelete,
      });

      if (data === null) {
        throw new NotFoundError('Record not found');
      }

      // Delete the document
      await data.delete({
        force: hardDelete,
        deletedBy: owner?.id,
      });

      // Handle hard delete vs soft delete tracking
      if (hardDelete) {
        // Add to trash for hard deletes
        this.addToTrash({
          entity_id: data._id,
          data: data.toJSON(),
          created_by: owner?.id,
        });
      } else if (this.options.history && history) {
        // Add to history for soft deletes
        this.addToHistory({
          entity_id: data._id,
          action: 'delete',
          data: data.toJSON(),
          created_by: owner?.id,
        });
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Delete multiple records in a single bulk operation.
   *
   * Features:
   * - Efficient batch deletion
   * - Soft delete by default (can be restored)
   * - Hard delete option (permanently removes records)
   * - Automatic cache invalidation
   * - Note: Does not log individual history/trash entries for performance
   *
   * @param job - Job configuration containing options (with where clause) and owner
   * @returns Promise resolving to deletion result or error
   */
  async deleteBulkRecords(job: MongoJob<M>): Promise<MongoResponse> {
    try {
      const { options = {}, owner } = job;

      // Validate required parameters
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling deleteBulkRecords - options.where is missing',
        };
      }

      const { where = {}, hardDelete = false } = options;

      // Perform bulk delete operation
      const data = await this.model.bulkDelete(where, {
        force: hardDelete,
        deletedBy: owner?.id,
      });

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  // =========================================================================
  // Restore Operations
  // =========================================================================

  /**
   * Restore a soft-deleted record.
   *
   * Features:
   * - Restore previously soft-deleted records
   * - Automatic owner tracking (restoredBy)
   * - History logging
   * - Automatic cache invalidation
   * - Custom primary key support
   *
   * @param job - Job configuration containing id, pk, options, owner, and history flag
   * @returns Promise resolving to restored record or error
   */
  async restoreRecord(job: MongoJob<M>): Promise<MongoGetOneResponse<M>> {
    try {
      const { id, pk = '_id', options = {}, owner, history = true } = job;

      // Validate required parameters
      if (!id) {
        return { error: 'Error calling restoreRecord - id is missing' };
      }

      const { where = {} } = options;

      // Find the soft-deleted document
      const data = await this.model.findOne({ ...where, [pk]: id }, null, {
        ...options,
        onlyDeleted: true,
      });

      if (data === null) {
        throw new NotFoundError('Record not found');
      }

      // Restore the document
      await data.restore({
        restoredBy: owner?.id,
      });

      // Add to history if enabled
      if (this.options.history && history) {
        this.addToHistory({
          entity_id: data._id,
          action: 'restore',
          data: data.toJSON(),
          created_by: owner?.id,
        });
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      return { data };
    } catch (error) {
      return { error };
    }
  }

  // =========================================================================
  // Aggregation Operations
  // =========================================================================

  /**
   * Execute an aggregation pipeline on the collection.
   *
   * Features:
   * - Complex data transformations and calculations
   * - Support for MongoDB aggregation pipeline stages
   * - Optional inclusion of soft-deleted records
   * - Custom aggregation options
   *
   * @param job - Job configuration containing options (aggregate pipeline, aggregateOptions, withDeleted)
   * @returns Promise resolving to aggregation results or error
   */
  async aggregateRecords(job: MongoJob<M>): Promise<MongoResponse> {
    try {
      const {
        aggregate = [],
        aggregateOptions = {},
        withDeleted = false,
      } = job.options || {};

      // Execute aggregation pipeline
      const data = await this.model.aggregate(aggregate, {
        ...aggregateOptions,
        withDeleted,
      });

      return { data };
    } catch (error) {
      return { error };
    }
  }
}
