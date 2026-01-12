import { CachingService } from '@core/modules/caching/caching.service';
import { addDays, snakeCase } from '@core/utils';
import { NotFoundError } from '@core/utils/error';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/sequelize';
import { History } from '@shared/modules/history/entities/history.entity';
import { Trash } from '@shared/modules/trash/entities/trash.entity';
import { Attributes, Model, Sequelize, WhereOptions } from 'sequelize';
import type { SqlModelOption } from './sql.module';
import {
  SqlCountResponse,
  SqlCreateBulkResponse,
  SqlCreateResponse,
  SqlDeleteOneResponse,
  SqlDeleteResponse,
  SqlGetAllResponse,
  SqlGetOneResponse,
  SqlJob,
  SqlResponse,
  SqlUpdateResponse,
} from './utils/job';
import { SqlSchema } from './utils/schema';

/**
 * Generic SQL service providing CRUD operations and advanced features.
 *
 * This service acts as a base class for all SQL operations, providing:
 * - Standard CRUD operations (create, read, update, delete)
 * - Bulk operations for multiple records
 * - Soft delete and restore functionality
 * - History tracking for audit trails
 * - Trash management for hard-deleted records
 * - Cache management with tag-based invalidation
 *
 * @template M - The model type extending SqlSchema
 */
@Injectable()
export class SqlService<M extends SqlSchema> {
  /** The Sequelize model instance for this service */
  private readonly model: any;

  constructor(
    @Inject('MODEL_NAME') private readonly modelName: string,
    @Inject('MODEL_OPTIONS') private readonly options: SqlModelOption,
    @InjectConnection() private readonly connection: Sequelize,
    private readonly cachingService: CachingService,
    private readonly _config: ConfigService,
  ) {
    // Get the model instance from the connection
    this.model = this.connection.model(modelName);
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
    } as any).catch((err) => {
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
    } as any).catch((err) => {
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
  async createRecord(job: SqlJob<M>): Promise<SqlCreateResponse<M>> {
    try {
      const { body, owner, options = {}, history = true } = job;

      // Validate required parameters
      if (typeof body === 'undefined') {
        return {
          error: 'Error calling createRecord - body is missing',
        };
      }

      // Prepare data with owner information
      const dataToCreate: any = { ...body };
      if (owner?.id) {
        dataToCreate.created_by = owner.id;
        dataToCreate.updated_by = owner.id;
      }

      // Create new record
      let data = await this.model.create(dataToCreate, options as any);

      // Add to history if enabled
      if (this.options.history && history) {
        this.addToHistory({
          entity_id: data.get('id') as any,
          action: 'create',
          created: true,
          data: data.toJSON(),
          created_by: owner?.id,
        } as any);
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      // Reload with includes if requested
      const { include } = options;
      if (include) {
        data = await data.reload({ include });
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
    job: SqlJob<M>,
  ): Promise<SqlCreateBulkResponse<M>> {
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
        records.forEach((record: any) => {
          record.created_by = owner.id;
          record.updated_by = owner.id;
        });
      }

      // Perform bulk create operation
      const data = await this.model.bulkCreate(records as any[], options as any);

      // Add each record to history if enabled
      if (this.options.history && history) {
        data.forEach((item) => {
          this.addToHistory({
            entity_id: item.get('id') as any,
            action: 'create',
            created: true,
            data: item.toJSON(),
            created_by: owner?.id,
          } as any);
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
   * - Optional instance reuse (skip fetch if instance already provided)
   * - Automatic owner tracking (updated_by)
   * - History logging with previous data snapshot
   * - Automatic cache invalidation
   * - Optional population of referenced documents
   * - Optional ignore not found errors
   *
   * @param job - Job configuration containing id, body, owner, pk, options, and history flag
   * @returns Promise resolving to updated record with previous data or error
   */
  async updateRecord(job: SqlJob<M>): Promise<SqlUpdateResponse<M>> {
    try {
      const {
        id,
        body = {},
        owner,
        pk = 'id',
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
        attributes,
        include,
        ignoreNotFound = false,
        instance,
        withDeleted = false,
      } = options;

      // Use provided instance or fetch from database
      let data = instance;
      if (!data) {
        data = await this.model.findOne({
          where: {
            ...where,
            [pk]: id,
          } as WhereOptions<Attributes<M>>,
          attributes,
          include,
          paranoid: !withDeleted,
        } as any);

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

      // Apply updates to instance
      Object.assign(data, body);

      // Set owner information if provided
      if (owner?.id) {
        (data as any).updated_by = owner.id;
      }

      // Save the updated instance
      await data.save();

      // Add to history if enabled
      if (this.options.history && history) {
        this.addToHistory({
          entity_id: (data as any).id,
          action: 'update',
          data: data.toJSON(),
          previous_data: previousData,
          created_by: owner?.id,
        } as any);
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      // Reload with includes if requested
      if (include) {
        await data.reload({ include });
      }

      return { data, previousData: previousData as Partial<M> };
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
  async findAndUpdateRecord(job: SqlJob<M>): Promise<SqlUpdateResponse<M>> {
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

      const {
        where = {},
        attributes,
        include,
        ignoreNotFound = false,
        withDeleted = false,
      } = options;

      // Find the record
      const data = await this.model.findOne({
        where,
        attributes,
        include,
        paranoid: !withDeleted,
      } as any);

      if (data === null && !ignoreNotFound) {
        throw new NotFoundError('Record not found');
      }

      // Handle case where record doesn't exist
      if (!data) {
        return { data };
      }

      // Capture previous state before update
      const previousData = data.toJSON();

      // Apply updates to instance
      Object.assign(data, body);

      // Set owner information if provided
      if (owner?.id) {
        (data as any).updated_by = owner.id;
      }

      // Save the updated instance
      await data.save();

      // Add to history if enabled
      if (this.options.history && history) {
        this.addToHistory({
          entity_id: (data as any).id,
          action: 'update',
          data: data.toJSON(),
          previous_data: previousData,
          created_by: owner?.id,
        } as any);
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      return { data, previousData: previousData as Partial<M> };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Update multiple records in a single bulk operation.
   *
   * Features:
   * - Efficient batch update using update
   * - Automatic owner tracking (updated_by)
   * - Automatic cache invalidation
   * - Note: Does not log individual history entries for performance
   *
   * @param job - Job configuration containing body, owner, and options (with where clause)
   * @returns Promise resolving to update result or error
   */
  async updateBulkRecords(job: SqlJob<M>): Promise<SqlResponse> {
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
      const updateData: any = { ...body };
      if (owner?.id) {
        updateData.updated_by = owner.id;
      }

      const { where = {}, withDeleted = false } = options;

      // Perform bulk update operation
      const [affectedCount] = await this.model.update(updateData, {
        where,
        paranoid: !withDeleted,
      } as any);

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      return { data: { affectedCount } };
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
   * @param job - Job configuration containing options (where, attributes, pagination, limit, offset)
   * @returns Promise resolving to array of records with optional pagination metadata or error
   */
  async getAllRecords(job: SqlJob<M>): Promise<SqlGetAllResponse<M>> {
    try {
      const { options = {} } = job;
      const {
        where = {},
        attributes,
        include,
        order,
        pagination = false,
        withDeleted = false,
      } = options;

      // Set limit based on configuration or provided value
      let limit = options.limit;
      if (!limit) {
        limit = this._config.get('paginationLimit');
      } else if (limit === -1) {
        limit = this._config.get('paginationMaxLimit');
      }

      const offset = options.offset || options.skip || 0;

      // Build find options
      const findOptions: any = {
        where,
        attributes,
        include,
        order,
        paranoid: !withDeleted,
      };

      // Handle paginated vs non-paginated requests
      if (pagination) {
        findOptions.limit = limit;
        findOptions.offset = offset;

        // Fetch data and count in parallel for better performance
        const { rows: data, count } = await this.model.findAndCountAll(
          findOptions,
        );

        return {
          data: data as M[],
          offset,
          limit,
          count,
        };
      } else {
        // Simple list without pagination metadata
        findOptions.limit = limit;
        if (offset) {
          findOptions.offset = offset;
        }

        const data = await this.model.findAll(findOptions);
        return {
          data: data as M[],
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
  async countAllRecords(job: SqlJob<M>): Promise<SqlCountResponse> {
    try {
      const { where = {}, withDeleted = false } = job.options || {};
      const data = await this.model.count({
        where,
        paranoid: !withDeleted,
      } as any);
      return { count: data };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Find a single record by its primary key.
   *
   * Features:
   * - Custom primary key support (default: id)
   * - Additional where conditions
   * - Custom projection
   * - Optional allow empty result
   *
   * @param job - Job configuration containing id, pk, and options
   * @returns Promise resolving to found record or error
   */
  async findRecordById(job: SqlJob<M>): Promise<SqlGetOneResponse<M>> {
    try {
      const { id, pk = 'id', options = {} } = job;

      // Validate required parameters
      if (!id) {
        return { error: 'Error calling findRecordById - id is missing' };
      }

      const {
        where = {},
        attributes,
        include,
        allowEmpty,
        withDeleted = false,
      } = options;

      // Find the record
      const data = await this.model.findOne({
        where: { ...where, [pk]: id } as WhereOptions<Attributes<M>>,
        attributes,
        include,
        paranoid: !withDeleted,
      } as any);

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
  async findOneRecord(job: SqlJob<M>): Promise<SqlGetOneResponse<M>> {
    try {
      const { options = {} } = job;

      // Validate required parameters
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling findOneRecord - options.where is missing',
        };
      }

      const {
        where = {},
        attributes,
        include,
        allowEmpty,
        withDeleted = false,
      } = options;

      // Find the record
      const data = await this.model.findOne({
        where,
        attributes,
        include,
        paranoid: !withDeleted,
      } as any);

      if (data === null && !allowEmpty) {
        throw new NotFoundError('Record not found');
      }

      return { data };
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
  async findOrCreate(job: SqlJob<M>): Promise<SqlCreateResponse<M>> {
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

      const { where = {}, attributes, include, withDeleted = false } = options;

      // Prepare defaults with owner information
      const defaults: any = { ...body };
      if (owner?.id) {
        defaults.created_by = owner.id;
        defaults.updated_by = owner.id;
      }

      // Try to find or create record
      const [data, created] = await this.model.findOrCreate({
        where,
        defaults,
        attributes,
        include,
        paranoid: !withDeleted,
      } as any) as [M, boolean];

      // Add to history if enabled and record was created
      if (created && this.options.history && history) {
        this.addToHistory({
          entity_id: (data as any).id,
          action: 'create',
          created,
          data: data.toJSON(),
          created_by: owner?.id,
        } as any);
      }

      // Invalidate cache if enabled and record was created
      if (created && this.options.cache) {
        await this.clearCache();
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
  async createOrUpdate(job: SqlJob<M>): Promise<SqlCreateResponse<M>> {
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

      const { where = {}, attributes, include, withDeleted = false } = options;

      // Try to find existing record
      let data = await this.model.findOne({
        where,
        attributes,
        include,
        paranoid: !withDeleted,
      } as any);

      let created = false;

      if (data !== null) {
        // Update existing record
        const previousData = data.toJSON();

        Object.assign(data, body);

        // Set owner information if provided
        if (owner?.id) {
          (data as any).updated_by = owner.id;
        }

        await data.save();

        // Add to history if enabled
        if (this.options.history && history) {
          this.addToHistory({
            entity_id: (data as any).id,
            action: 'update',
            data: data.toJSON(),
            previous_data: previousData,
            created_by: owner?.id,
          } as any);
        }
      } else {
        // Create new record
        const dataToCreate: any = { ...body };
        if (owner?.id) {
          dataToCreate.created_by = owner.id;
          dataToCreate.updated_by = owner.id;
        }

        data = await this.model.create(dataToCreate);
        created = true;

        // Add to history if enabled
        if (this.options.history && history) {
          this.addToHistory({
            entity_id: (data as any).id,
            action: 'create',
            created: true,
            data: data.toJSON(),
            created_by: owner?.id,
          } as any);
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
  async deleteRecord(job: SqlJob<M>): Promise<SqlDeleteOneResponse<M>> {
    try {
      const { id, pk = 'id', options = {}, owner, history = true } = job;

      // Validate required parameters
      if (!id) {
        return { error: 'Error calling deleteRecord - id is missing' };
      }

      const { where = {}, hardDelete = false, withDeleted = false } = options;

      // Find the record (including soft-deleted ones if hard delete requested)
      const data = await this.model.findOne({
        where: {
          ...where,
          [pk]: id,
        } as WhereOptions<Attributes<M>>,
        paranoid: hardDelete ? false : !withDeleted,
      } as any);

      if (data === null) {
        throw new NotFoundError('Record not found');
      }

      // Delete the record
      if (hardDelete) {
        await data.destroy({ force: true });

        // Add to trash for hard deletes
        this.addToTrash({
          entity_id: (data as any).id,
          data: data.toJSON(),
          created_by: owner?.id,
        } as any);
      } else {
        // Soft delete
        if (owner?.id) {
          (data as any).deleted_by = owner.id;
          (data as any).updated_by = owner.id;
          await data.save();
        }
        await data.destroy();

        // Add to history for soft deletes
        if (this.options.history && history) {
          this.addToHistory({
            entity_id: (data as any).id,
            action: 'delete',
            data: data.toJSON(),
            created_by: owner?.id,
          } as any);
        }
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
  async findAndDeleteRecord(job: SqlJob<M>): Promise<SqlDeleteResponse<M>> {
    try {
      const { options = {}, owner, history = true } = job;

      // Validate required parameters
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling findAndDeleteRecord - options.where is missing',
        };
      }

      const { where = {}, hardDelete = false, withDeleted = false } = options;

      // Find the record (including soft-deleted ones if hard delete requested)
      const data = await this.model.findOne({
        where,
        paranoid: hardDelete ? false : !withDeleted,
      } as any);

      if (data === null) {
        throw new NotFoundError('Record not found');
      }

      // Delete the record
      if (hardDelete) {
        await data.destroy({ force: true });

        // Add to trash for hard deletes
        this.addToTrash({
          entity_id: (data as any).id,
          data: data.toJSON(),
          created_by: owner?.id,
        } as any);
      } else {
        // Soft delete
        if (owner?.id) {
          (data as any).deleted_by = owner.id;
          (data as any).updated_by = owner.id;
          await data.save();
        }
        await data.destroy();

        // Add to history for soft deletes
        if (this.options.history && history) {
          this.addToHistory({
            entity_id: (data as any).id,
            action: 'delete',
            data: data.toJSON(),
            created_by: owner?.id,
          } as any);
        }
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
  async deleteBulkRecords(job: SqlJob<M>): Promise<SqlResponse> {
    try {
      const { options = {}, owner } = job;

      // Validate required parameters
      if (typeof options.where === 'undefined') {
        return {
          error: 'Error calling deleteBulkRecords - options.where is missing',
        };
      }

      const { where = {}, hardDelete = false, withDeleted = false } = options;

      let affectedCount: number;

      if (hardDelete) {
        // Perform hard delete
        affectedCount = await this.model.destroy({
          where,
          force: true,
          paranoid: false,
        } as any);
      } else {
        // Perform soft delete
        if (owner?.id) {
          await this.model.update(
            {
              deleted_by: owner.id,
              updated_by: owner.id,
            } as any,
            {
              where,
              paranoid: !withDeleted,
            } as any,
          );
        }

        affectedCount = await this.model.destroy({
          where,
          paranoid: !withDeleted,
        } as any);
      }

      // Invalidate cache if enabled
      if (this.options.cache) {
        await this.clearCache();
      }

      return { data: { affectedCount } };
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
  async restoreRecord(job: SqlJob<M>): Promise<SqlGetOneResponse<M>> {
    try {
      const { id, pk = 'id', options = {}, owner, history = true } = job;

      // Validate required parameters
      if (!id) {
        return { error: 'Error calling restoreRecord - id is missing' };
      }

      const { where = {} } = options;

      // Find the soft-deleted record
      const data = await this.model.findOne({
        where: { ...where, [pk]: id } as WhereOptions<Attributes<M>>,
        paranoid: false,
      } as any);

      if (data === null) {
        throw new NotFoundError('Record not found');
      }

      // Restore the record
      await data.restore();

      // Clear deletion fields
      (data as any).deleted_at = null;
      (data as any).deleted_by = null;

      // Set owner information if provided
      if (owner?.id) {
        (data as any).updated_by = owner.id;
      }

      await data.save();

      // Add to history if enabled
      if (this.options.history && history) {
        this.addToHistory({
          entity_id: (data as any).id,
          action: 'restore',
          data: data.toJSON(),
          created_by: owner?.id,
        } as any);
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
}
