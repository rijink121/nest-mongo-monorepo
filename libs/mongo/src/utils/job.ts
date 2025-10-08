import { Job, JobResponse } from '@core/utils/job';
import {
  AggregateOptions,
  FilterQuery,
  FlattenMaps,
  PipelineStage,
  QueryOptions,
  Types,
} from 'mongoose';
import { ModelWrap } from '../definitions';
import { MongoSchema } from './schema';

// MongoJobOptions interface defines options for MongoDB jobs
export interface MongoJobOptions<M> extends QueryOptions<M> {
  /**
   * Where conditions
   */
  where?: FilterQuery<M>;

  /**
   * Enable pagination, default is false
   * @default false
   */
  pagination?: boolean;

  /**
   * Get response even if record not found, by default false and it throws an error if record not found
   * @default false
   */
  allowEmpty?: boolean;

  /**
   * Retrieve records including deleted records, default is false
   * @default false
   */
  withDeleted?: boolean;

  /**
   * Hard delete record, default is false (soft delete)
   * @default false
   */
  hardDelete?: boolean;

  /**
   * Sub-documents (array) field name
   */
  subDocumentField?: string;

  /**
   * Sub-document id
   */
  subDocumentId?: string | Types.ObjectId;

  /**
   * Aggregate pipelines
   */
  aggregate?: PipelineStage[];

  /**
   * Aggregate options
   */
  aggregateOptions?: AggregateOptions;

  /**
   * Other mongoose options
   */
  mongooseOptions?: Record<string, unknown>;
}

// MongoResponse interface extends JobResponse and defines the structure of the response data
export interface MongoResponse<T = unknown> extends JobResponse {
  /**
   * Response data
   */
  data?: T;
}

// MongoCountResponse interface extends JobResponse and defines the structure for count responses
export interface MongoCountResponse extends JobResponse {
  /**
   * Total available records count
   */
  count?: number;
}

// MongoGetOneResponse interface extends JobResponse and defines the structure for single record responses
export interface MongoGetOneResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: ModelWrap<M> | null;
}

// MongoGetOneResponse interface extends JobResponse and defines the structure for single record responses
export interface MongoDeleteOneResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: ModelWrap<M>;
}

// MongoGetAllResponse interface extends JobResponse and defines the structure for multiple record responses
export interface MongoGetAllResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: ModelWrap<M>[];

  /**
   * Offset for pagination
   */
  offset?: number;

  /**
   * Limit for pagination
   */
  limit?: number;

  /**
   * Total available records count
   */
  count?: number;
}

// MongoCreateResponse interface extends MongoGetOneResponse and defines the structure for create responses
export interface MongoCreateResponse<M> extends MongoGetOneResponse<M> {
  /**
   * Is created flag
   */
  created?: boolean;
}

// MongoUpdateResponse interface extends MongoGetOneResponse and defines the structure for update responses
export interface MongoUpdateResponse<M> extends MongoGetOneResponse<M> {
  /**
   * Previous data object
   */
  previousData?: FlattenMaps<M>;
}

// MongoDeleteResponse interface extends JobResponse and defines the structure for delete responses
export interface MongoDeleteResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: ModelWrap<M>;
}

// MongoCreateBulkResponse interface extends JobResponse and defines the structure for bulk create responses
export interface MongoCreateBulkResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: ModelWrap<M>[];
}

// MongoJob interface extends Job and defines the structure for MongoDB job operations
export interface MongoJob<M extends MongoSchema> extends Job {
  /**
   * primary key name of the model
   */
  pk?: string;

  /**
   * primary key value of the model
   */
  id?: number | string;

  /**
   * body object used for create or update
   */
  body?: Partial<M> & {
    [key: string]: unknown;
  };

  /**
   * array of records used for bulk create
   */
  records?: {
    [key: string]: unknown;
  }[];

  /**
   * parameters for mongo
   */
  options?: MongoJobOptions<M>;

  /**
   * flag to save to history
   * @default true
   */
  history?: boolean;
}
