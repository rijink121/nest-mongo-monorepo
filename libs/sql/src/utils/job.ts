import { Job, JobResponse } from '@core/utils/job';
import {
  Attributes,
  FindOptions,
  Includeable,
  Model,
  Order,
  WhereOptions,
} from 'sequelize';
import { SqlSchema } from './schema';

/**
 * SQL Job Options interface defines options for SQL operations.
 */
export interface SqlJobOptions<M> extends Omit<FindOptions<Attributes<M>>, 'where'> {
  /**
   * Where conditions for filtering
   */
  where?: WhereOptions<Attributes<M>>;

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
   * Retrieve records including deleted records, default is false (uses paranoid: false)
   * @default false
   */
  withDeleted?: boolean;

  /**
   * Hard delete record, default is false (soft delete)
   * @default false
   */
  hardDelete?: boolean;

  /**
   * Include associations/relations
   */
  include?: Includeable | Includeable[];

  /**
   * Attributes to select
   */
  attributes?: string[] | { exclude?: string[]; include?: string[] };

  /**
   * Ordering criteria
   */
  order?: Order;

  /**
   * Limit for query
   */
  limit?: number;

  /**
   * Offset for pagination
   */
  offset?: number;

  /**
   * Skip value (alias for offset)
   */
  skip?: number;

  /**
   * Projection fields (alias for attributes)
   */
  projection?: string[] | { exclude?: string[]; include?: string[] };

  /**
   * Get response even if record not found, by default false and it throws an error if record not found (update/delete)
   * @default false
   */
  ignoreNotFound?: boolean;

  /**
   * Model instance to be used in update operations
   */
  instance?: Model<M, M> | null;
}

/**
 * SQL Response interface extends JobResponse and defines the structure of the response data.
 */
export interface SqlResponse<T = unknown> extends JobResponse {
  /**
   * Response data
   */
  data?: T;
}

/**
 * SQL Count Response interface extends JobResponse and defines the structure for count responses.
 */
export interface SqlCountResponse extends JobResponse {
  /**
   * Total available records count
   */
  count?: number;
}

/**
 * SQL Get One Response interface extends JobResponse and defines the structure for single record responses.
 */
export interface SqlGetOneResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: Model<M, M> | null;
}

/**
 * SQL Delete One Response interface extends JobResponse and defines the structure for single record delete responses.
 */
export interface SqlDeleteOneResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: Model<M, M>;
}

/**
 * SQL Get All Response interface extends JobResponse and defines the structure for multiple record responses.
 */
export interface SqlGetAllResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: Model<M, M>[];

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

/**
 * SQL Create Response interface extends SqlGetOneResponse and defines the structure for create responses.
 */
export interface SqlCreateResponse<M> extends SqlGetOneResponse<M> {
  /**
   * Is created flag
   */
  created?: boolean;
}

/**
 * SQL Update Response interface extends SqlGetOneResponse and defines the structure for update responses.
 */
export interface SqlUpdateResponse<M> extends SqlGetOneResponse<M> {
  /**
   * Previous data object
   */
  previousData?: Partial<M>;
}

/**
 * SQL Delete Response interface extends JobResponse and defines the structure for delete responses.
 */
export interface SqlDeleteResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: Model<M, M>;
}

/**
 * SQL Create Bulk Response interface extends JobResponse and defines the structure for bulk create responses.
 */
export interface SqlCreateBulkResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: Model<M, M>[];
}

/**
 * SQL Job interface extends Job and defines the structure for SQL job operations.
 */
export interface SqlJob<M extends SqlSchema, T = unknown> extends Job<T> {
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
  body?: Partial<Attributes<M>> & {
    [key: string]: unknown;
  };

  /**
   * array of records used for bulk create
   */
  records?: Array<Partial<Attributes<M>> & { [key: string]: unknown }>;

  /**
   * parameters for SQL operations
   */
  options?: SqlJobOptions<M>;

  /**
   * flag to save to history
   * @default true
   */
  history?: boolean;
}
