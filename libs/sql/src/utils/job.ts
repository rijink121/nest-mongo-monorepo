import { Job, JobResponse } from '@core/utils/job';
import {
  BulkCreateOptions,
  CountOptions,
  CreateOptions,
  CreationAttributes,
  DestroyOptions,
  FindAndCountOptions,
  FindOptions,
  FindOrBuildOptions,
  WhereOptions,
} from 'sequelize';
import { SqlSchema } from './schema';

export type Scope = (string | [string, ...unknown[]])[];

/**
 * SQL Job Options interface defines options for SQL operations.
 */
export type SqlJobOptions<M> = FindOptions<M> &
  CreateOptions<M> &
  BulkCreateOptions<M> &
  FindAndCountOptions<M> &
  CountOptions<M> &
  DestroyOptions<M> &
  FindOrBuildOptions & {
    /**
     * Where conditions for filtering
     */
    where?: WhereOptions<any>;

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
     * Get response even if record not found, by default false and it throws an error if record not found (update/delete)
     * @default false
     */
    ignoreNotFound?: boolean;

    /**
     * Scope to apply on the model
     * @default []
     */
    scope?: Scope;
    /**
     * Ignore all scopes including default scope
     * @default false
     */
    unscoped?: boolean;
    /**
     * Other sequelize options
     */
    sequelizeOptions?: any;
  };

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
  data?: M | null;
}

/**
 * SQL Delete One Response interface extends JobResponse and defines the structure for single record delete responses.
 */
export interface SqlDeleteOneResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: M;
}

/**
 * SQL Get All Response interface extends JobResponse and defines the structure for multiple record responses.
 */
export interface SqlGetAllResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: M[];

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
  previousData?: M;
}

/**
 * SQL Delete Response interface extends JobResponse and defines the structure for delete responses.
 */
export interface SqlDeleteResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: M;
}

/**
 * SQL Create Bulk Response interface extends JobResponse and defines the structure for bulk create responses.
 */
export interface SqlCreateBulkResponse<M> extends JobResponse {
  /**
   * Response data
   */
  data?: M[];
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
  id?: number;

  /**
   * body object used for create or update
   */
  body?: CreationAttributes<M> & { [key: string]: unknown };

  /**
   * array of records used for bulk create
   */
  records?: Array<CreationAttributes<M> & { [key: string]: unknown }>;

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
