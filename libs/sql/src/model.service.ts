/* eslint-disable @typescript-eslint/no-unused-vars */
import { DeletePayload, ReadPayload, WritePayload } from './decorators/payload';
import { SqlService } from './sql.service';
import type { SqlJob } from './utils/job';
import {
  SqlCountResponse,
  SqlCreateResponse,
  SqlDeleteResponse,
  SqlGetAllResponse,
  SqlGetOneResponse,
  SqlUpdateResponse,
} from './utils/job';
import { SqlSchema } from './utils/schema';

export type SearchField<M> = keyof M | string;
export type SearchFields<M> =
  | SearchField<M>[]
  | Record<string, SearchField<M>[]>;

export class ModelService<M extends SqlSchema> {
  /**
   * searchFields
   * @property array of fields to include in search
   */
  searchFields: SearchFields<M> = [];

  /**
   * @getter $db - Get database service instance
   */
  get $db() {
    return this.db;
  }

  constructor(protected readonly db: SqlService<M>) {}

  /**
   * Hook function that executes before findAll, getCount, findById and findOne operations.
   * Child classes can override this method to implement custom logic before read operations.
   *
   * @param job - The job object containing operation parameters
   * @example
   * ```typescript
   * protected async doBeforeRead(job: SqlJob<User>): Promise<void> {
   *   // Add custom filtering or validation logic
   *   if (!job.options) job.options = {};
   *   job.options.where = { ...job.options.where, active: true };
   * }
   * ```
   */
  protected async doBeforeRead(job: SqlJob<M>): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes before findById and findOne operations.
   * Child classes can override this method to implement custom logic before single record find operations.
   *
   * @param job - The job object containing operation parameters
   * @example
   * ```typescript
   * protected async doBeforeFind(job: SqlJob<User>): Promise<void> {
   *   // Add access control or additional filtering
   *   if (!job.options) job.options = {};
   *   job.options.include = ['profile', 'roles'];
   * }
   * ```
   */
  protected async doBeforeFind(job: SqlJob<M>): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes before findAll operation.
   * Child classes can override this method to implement custom logic before list operations.
   *
   * @param job - The job object containing operation parameters
   * @example
   * ```typescript
   * protected async doBeforeFindAll(job: SqlJob<User>): Promise<void> {
   *   // Add sorting or filtering logic
   *   if (!job.options) job.options = {};
   *   job.options.order = [['created_at', 'DESC']];
   * }
   * ```
   */
  protected async doBeforeFindAll(job: SqlJob<M>): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes before getCount operation.
   * Child classes can override this method to implement custom logic before count operations.
   *
   * @param job - The job object containing operation parameters
   * @example
   * ```typescript
   * protected async doBeforeCount(job: SqlJob<User>): Promise<void> {
   *   // Add filtering for count operation
   *   if (!job.options) job.options = {};
   *   job.options.where = { ...job.options.where, deleted_at: null };
   * }
   * ```
   */
  protected async doBeforeCount(job: SqlJob<M>): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes before create and update operations.
   * Child classes can override this method to implement custom logic before write operations.
   *
   * @param job - The job object containing operation parameters
   * @example
   * ```typescript
   * protected async doBeforeWrite(job: SqlJob<User>): Promise<void> {
   *   // Add validation or data transformation
   *   if (job.body && job.body.email) {
   *     job.body.email = job.body.email.toLowerCase();
   *   }
   * }
   * ```
   */
  protected async doBeforeWrite(job: SqlJob<M>): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes before create operation.
   * Child classes can override this method to implement custom logic before record creation.
   *
   * @param job - The job object containing operation parameters
   * @example
   * ```typescript
   * protected async doBeforeCreate(job: SqlJob<User>): Promise<void> {
   *   // Set default values or validate required fields
   *   if (job.body) {
   *     job.body.status = 'active';
   *   }
   * }
   * ```
   */
  protected async doBeforeCreate(job: SqlJob<M>): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes before update operation.
   * Child classes can override this method to implement custom logic before record updates.
   *
   * @param job - The job object containing operation parameters
   * @example
   * ```typescript
   * protected async doBeforeUpdate(job: SqlJob<User>): Promise<void> {
   *   // Add update timestamps or validation
   *   if (job.body) {
   *     job.body.updated_at = new Date();
   *   }
   * }
   * ```
   */
  protected async doBeforeUpdate(job: SqlJob<M>): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes before delete operation.
   * Child classes can override this method to implement custom logic before record deletion.
   *
   * @param job - The job object containing operation parameters
   * @example
   * ```typescript
   * protected async doBeforeDelete(job: SqlJob<User>): Promise<void> {
   *   // Add authorization checks or cascade delete logic
   *   const record = await this.findById({ id: job.id });
   *   if (record.data?.role === 'admin') {
   *     throw new Error('Cannot delete admin users');
   *   }
   * }
   * ```
   */
  protected async doBeforeDelete(job: SqlJob<M>): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * findAll
   * @function search and get records with total count and pagination
   * @param {object} job - mandatory - a job object representing the job information
   * @return {object} job response object
   */
  @ReadPayload
  async findAll(job: SqlJob<M>): Promise<SqlGetAllResponse<M>> {
    try {
      await this.doBeforeRead(job);
      await this.doBeforeFindAll(job);
      const response = await this.db.getAllRecords(job);
      if (response.error) throw response.error as Error;
      await this.doAfterFindAll(job, response);
      return response;
    } catch (error) {
      return { error };
    }
  }

  /**
   * getCount
   * @function search and get records with total count and pagination
   * @param {object} job - mandatory - a job object representing the job information
   * @return {object} job response object
   */
  @ReadPayload
  async getCount(job: SqlJob<M>): Promise<SqlCountResponse> {
    try {
      await this.doBeforeRead(job);
      await this.doBeforeCount(job);
      const response = await this.db.countAllRecords(job);
      if (response.error) throw response.error as Error;
      await this.doAfterCount(job, response);
      return response;
    } catch (error) {
      return { error };
    }
  }

  /**
   * findById
   * @function get a record using primary key
   * @param {object} job - mandatory - a job object representing the job information
   * @return {object} job response object
   */
  @ReadPayload
  async findById(job: SqlJob<M>): Promise<SqlGetOneResponse<M>> {
    try {
      await this.doBeforeRead(job);
      await this.doBeforeFind(job);
      const response = await this.db.findRecordById(job);
      if (response.error) throw response.error as Error;
      await this.doAfterFind(job, response);
      return response;
    } catch (error) {
      return { error };
    }
  }

  /**
   * findOne
   * @function search and find a record
   * @param {object} job - mandatory - a job object representing the job information
   * @return {object} job response object
   */
  @ReadPayload
  async findOne(job: SqlJob<M>): Promise<SqlGetOneResponse<M>> {
    try {
      await this.doBeforeRead(job);
      await this.doBeforeFind(job);
      const response = await this.db.findOneRecord(job);
      if (response.error) throw response.error as Error;
      await this.doAfterFind(job, response);
      return response;
    } catch (error) {
      return { error };
    }
  }

  /**
   * create
   * @function create a new record
   * @param {object} job - mandatory - a job object representing the job information
   * @return {object} job response object
   */
  @WritePayload
  async create(job: SqlJob<M>): Promise<SqlCreateResponse<M>> {
    try {
      await this.doBeforeWrite(job);
      await this.doBeforeCreate(job);
      const response = await this.db.createRecord(job);
      if (response.error) throw response.error as Error;
      await this.doAfterWrite(job, response);
      await this.doAfterCreate(job, response);
      return response;
    } catch (error) {
      return { error };
    }
  }

  /**
   * update
   * @function update a record using primary key
   * @param {object} job - mandatory - a job object representing the job information
   * @return {object} job response object
   */
  @WritePayload
  async update(job: SqlJob<M>): Promise<SqlUpdateResponse<M>> {
    try {
      await this.doBeforeWrite(job);
      await this.doBeforeUpdate(job);
      const response = await this.db.updateRecord(job);
      if (response.error) throw response.error as Error;
      await this.doAfterWrite(job, response);
      await this.doAfterUpdate(job, response);
      return response;
    } catch (error) {
      return { error };
    }
  }

  /**
   * delete
   * @function delete a record using primary key
   * @param {object} job - mandatory - a job object representing the job information
   * @return {object} job response object
   */
  @DeletePayload
  async delete(job: SqlJob<M>): Promise<SqlDeleteResponse<M>> {
    try {
      await this.doBeforeDelete(job);
      const response = await this.db.deleteRecord(job);
      if (response.error) throw response.error as Error;
      await this.doAfterDelete(job, response);
      return response;
    } catch (error) {
      return { error };
    }
  }

  /**
   * Hook function that executes after findById and findOne operations.
   * Child classes can override this method to implement custom logic after single record find operations.
   *
   * @param job - The job object containing operation parameters
   * @param _response - The response object containing the operation result
   * @example
   * ```typescript
   * protected async doAfterFind(
   *   job: SqlJob<User>,
   *   response: SqlGetOneResponse<User>
   * ): Promise<void> {
   *   // Log access or modify response data
   *   if (response.data) {
   *     console.log(`User ${response.data.id} was accessed`);
   *   }
   * }
   * ```
   */
  protected async doAfterFind(
    job: SqlJob<M>,
    _response: SqlGetOneResponse<M>,
  ): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes after findAll operation.
   * Child classes can override this method to implement custom logic after list operations.
   *
   * @param job - The job object containing operation parameters
   * @param _response - The response object containing the operation result
   * @example
   * ```typescript
   * protected async doAfterFindAll(
   *   job: SqlJob<User>,
   *   response: SqlGetAllResponse<User>
   * ): Promise<void> {
   *   // Add computed fields or log metrics
   *   console.log(`Found ${response.data?.length || 0} records`);
   * }
   * ```
   */
  protected async doAfterFindAll(
    job: SqlJob<M>,
    _response: SqlGetAllResponse<M>,
  ): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes after getCount operation.
   * Child classes can override this method to implement custom logic after count operations.
   *
   * @param job - The job object containing operation parameters
   * @param _response - The response object containing the operation result
   * @example
   * ```typescript
   * protected async doAfterCount(
   *   job: SqlJob<User>,
   *   response: SqlCountResponse
   * ): Promise<void> {
   *   // Log count metrics or cache results
   *   console.log(`Total count: ${response.count}`);
   * }
   * ```
   */
  protected async doAfterCount(
    job: SqlJob<M>,
    _response: SqlCountResponse,
  ): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes after create and update operations.
   * Child classes can override this method to implement custom logic after write operations.
   *
   * @param job - The job object containing operation parameters
   * @param _response - The response object containing the operation result
   * @example
   * ```typescript
   * protected async doAfterWrite(
   *   job: SqlJob<User>,
   *   response: SqlCreateResponse<User> | SqlUpdateResponse<User>
   * ): Promise<void> {
   *   // Send notifications or update cache
   *   if (response.data) {
   *     await this.notificationService.send(response.data);
   *   }
   * }
   * ```
   */
  protected async doAfterWrite(
    job: SqlJob<M>,
    _response: SqlCreateResponse<M> | SqlUpdateResponse<M>,
  ): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes after create operation.
   * Child classes can override this method to implement custom logic after record creation.
   *
   * @param job - The job object containing operation parameters
   * @param _response - The response object containing the operation result
   * @example
   * ```typescript
   * protected async doAfterCreate(
   *   job: SqlJob<User>,
   *   response: SqlCreateResponse<User>
   * ): Promise<void> {
   *   // Send welcome email or create related records
   *   if (response.data && response.created) {
   *     await this.emailService.sendWelcome(response.data.email);
   *   }
   * }
   * ```
   */
  protected async doAfterCreate(
    job: SqlJob<M>,
    _response: SqlCreateResponse<M>,
  ): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes after update operation.
   * Child classes can override this method to implement custom logic after record updates.
   *
   * @param job - The job object containing operation parameters
   * @param _response - The response object containing the operation result
   * @example
   * ```typescript
   * protected async doAfterUpdate(
   *   job: SqlJob<User>,
   *   response: SqlUpdateResponse<User>
   * ): Promise<void> {
   *   // Invalidate cache or send update notifications
   *   if (response.data) {
   *     await this.cacheService.invalidate(`user:${response.data.id}`);
   *   }
   * }
   * ```
   */
  protected async doAfterUpdate(
    job: SqlJob<M>,
    _response: SqlUpdateResponse<M>,
  ): Promise<void> {
    // Default implementation - child classes can override
  }

  /**
   * Hook function that executes after delete operation.
   * Child classes can override this method to implement custom logic after record deletion.
   *
   * @param job - The job object containing operation parameters
   * @param _response - The response object containing the operation result
   * @example
   * ```typescript
   * protected async doAfterDelete(
   *   job: SqlJob<User>,
   *   response: SqlDeleteResponse<User>
   * ): Promise<void> {
   *   // Clean up related data or send notifications
   *   if (response.data) {
   *     await this.cleanupUserData(response.data.id);
   *   }
   * }
   * ```
   */
  protected async doAfterDelete(
    job: SqlJob<M>,
    _response: SqlDeleteResponse<M>,
  ): Promise<void> {
    // Default implementation - child classes can override
  }
}
