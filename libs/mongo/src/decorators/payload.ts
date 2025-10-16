import {
  ApiQuery,
  ApiQueryCreate,
  ApiQueryDelete,
} from '@core/definitions/api-query.dto';
import { BadRequestException } from '@nestjs/common';
import { isObject } from 'class-validator';
import { FilterQuery, PopulateOptions } from 'mongoose';
import { ModelService, SearchField } from '../model.service';
import { buildPopulateTree, parseFieldsProjection } from '../utils';
import type { MongoJob } from '../utils/job';
import type { MongoSchema } from '../utils/schema';

/**
 * Type definition for async methods that can be decorated with @ReadPayload.
 */
type AsyncMethodDecorator<M extends MongoSchema, T> = (
  this: ModelService<M>,
  job: MongoJob<M, T>,
) => Promise<unknown>;

/**
 * Interface representing the normalized payload data structure
 * extracted from API query parameters.
 */
interface ReadPayloadData {
  /** Maximum number of records to return */
  limit?: number;
  /** Number of records to skip (for pagination) */
  offset?: number;
  /** Sort criteria as array of field names or [field, direction] tuples */
  sort?: (string | string[])[];
  /** Search term or scoped search [scope, term] */
  search?: string | string[];
  /** Fields to include in response */
  select?: string[];
  /** Filter conditions */
  where?: Record<string, unknown>;
  /** Relations to populate */
  populate?: string[];
  /** Predefined query scopes */
  scope?: (string | [string, ...(string | number)[]])[];
}

/**
 * Interface representing the normalized payload data structure
 * for write operations (create/update).
 */
interface WritePayloadData {
  /** Fields to include in response */
  select?: string[];
  /** Relations to populate */
  populate?: string[];
}

/**
 * Interface representing the normalized payload data structure
 * for delete operations.
 */
interface DeletePayloadData {
  /** Delete mode: 'soft' for logical deletion, 'hard' for physical deletion */
  mode?: 'soft' | 'hard';
}

/**
 * Decorator for converting request job.payload to job.options
 *
 * This decorator processes the payload from an API query and converts it into
 * MongoDB-compatible options, including:
 * - Pagination (limit, offset)
 * - Sorting
 * - Field selection
 * - Search functionality with scope support
 * - Population of relations
 * - Where conditions
 *
 * @param _target - The target object (unused)
 * @param _methodName - The method name (unused)
 * @param descriptor - The property descriptor of the method being decorated
 *
 * @example
 * ```typescript
 * class UserService extends ModelService<User> {
 *   @ReadPayload
 *   async findAll(job: MongoJob<User, ApiQuery>) {
 *     // job.options will be populated from job.payload
 *     return this.db.getAllRecords(job);
 *   }
 * }
 * ```
 */
export const ReadPayload = <M extends MongoSchema>(
  _target: unknown,
  _methodName: string,
  descriptor: TypedPropertyDescriptor<AsyncMethodDecorator<M, ApiQuery>>,
): void => {
  const original = descriptor.value;
  if (!original) return;

  descriptor.value = async function wrapper(
    this: ModelService<M>,
    job: MongoJob<M, ApiQuery>,
  ): Promise<unknown> {
    const { payload, options } = job;

    // ============================================
    // 1. Extract and normalize payload data
    // ============================================
    const readPayload: ReadPayloadData = {
      limit: payload?.limit,
      offset: payload?.offset,
      sort: payload?.sort,
      search: payload?.search,
      select: payload?.select,
      where: payload?.where,
      populate: payload?.populate,
    };

    // ============================================
    // 2. Process field selection (select)
    // ============================================
    const attributesWithPopulate = parseFieldsProjection(
      readPayload.select || [],
    );

    // ============================================
    // 3. Process where conditions and search
    // ============================================
    const where: FilterQuery<M> = (readPayload.where as FilterQuery<M>) ?? {};

    // Process search functionality
    if (readPayload.search && this.searchFields) {
      // Determine search scope and key
      const searchScope = Array.isArray(readPayload.search)
        ? readPayload.search[0]
        : 'default';
      const searchKey = Array.isArray(readPayload.search)
        ? readPayload.search[1]
        : readPayload.search;

      // Validate search scope if using scoped search
      if (
        Array.isArray(readPayload.search) &&
        (!isObject(this.searchFields) || !this.searchFields[searchScope])
      ) {
        throw new BadRequestException([
          {
            value: readPayload.search,
            property: 'search',
            children: [],
            constraints: {
              isString: 'Search must be a string or valid scoped search',
            },
          },
        ]);
      }

      // Get the appropriate search fields based on scope
      const searchFields: SearchField<M>[] =
        isObject(this.searchFields) && this.searchFields[searchScope]
          ? (this.searchFields[searchScope] as SearchField<M>[])
          : (this.searchFields as SearchField<M>[]);

      // Apply search filters
      if (!where.$and) {
        where.$and = [];
      }

      // Escape special regex characters for safe pattern matching
      const escapedSearchKey = searchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Create OR conditions for case-insensitive search across all search fields
      const searchConditions = searchFields.map((field) => ({
        [field]: { $regex: escapedSearchKey, $options: 'i' },
      }));

      where.$and.push({ $or: searchConditions as FilterQuery<M>[] });
    }

    // ============================================
    // 4. Process sort options
    // ============================================
    let sort: Record<string, 'asc' | 'desc'> | undefined = undefined;

    if (readPayload.sort) {
      sort = readPayload.sort.reduce((accumulator, currentValue) => {
        // Handle both string and [field, direction] formats
        if (typeof currentValue === 'string') {
          return {
            ...accumulator,
            [currentValue]: 'asc',
          };
        } else {
          return {
            ...accumulator,
            [currentValue[0]]: currentValue[1],
          };
        }
      }, {});
    }

    // ============================================
    // 5. Process populate options
    // ============================================
    let populate: PopulateOptions[] = [];

    // Build populate tree from explicit populate fields
    if (readPayload.populate) {
      populate = buildPopulateTree(readPayload.populate);
    }

    // Merge populate options from field selection
    if (
      attributesWithPopulate.populate &&
      attributesWithPopulate.populate.length > 0
    ) {
      populate = [...populate, ...attributesWithPopulate.populate];
    }

    // ============================================
    // 6. Construct final MongoDB options
    // ============================================
    job.options = {
      where: Object.keys(where).length > 0 ? where : undefined,
      populate,
      sort,
      projection: attributesWithPopulate.select || undefined,
      skip: readPayload.offset,
      limit: readPayload.limit,
      pagination: true,
      ...options, // Preserve any existing options
    };

    return await original.call(this, job);
  };
};

/**
 * Decorator for converting request job.payload to job.options for write operations.
 *
 * This decorator processes only the essential fields needed for create/update operations:
 * - Field selection (projection)
 * - Population of relations
 *
 * Unlike ReadPayload, this decorator does NOT process:
 * - Pagination (limit, offset)
 * - Sorting
 * - Search functionality
 * - Where conditions
 *
 * @param _target - The target object (unused)
 * @param _methodName - The method name (unused)
 * @param descriptor - The property descriptor of the method being decorated
 *
 * @example
 * ```typescript
 * class UserService extends ModelService<User> {
 *   @WritePayload
 *   async create(job: MongoJob<User, ApiQuery>) {
 *     // job.options will be populated with populate and projection
 *     return this.db.createRecord(job);
 *   }
 *
 *   @WritePayload
 *   async update(job: MongoJob<User, ApiQuery>) {
 *     // job.options will be populated from job.payload
 *     return this.db.updateRecord(job);
 *   }
 * }
 * ```
 */
export const WritePayload = <M extends MongoSchema>(
  _target: unknown,
  _methodName: string,
  descriptor: TypedPropertyDescriptor<AsyncMethodDecorator<M, ApiQueryCreate>>,
): void => {
  const original = descriptor.value;
  if (!original) return;

  descriptor.value = async function wrapper(
    this: ModelService<M>,
    job: MongoJob<M, ApiQueryCreate>,
  ): Promise<unknown> {
    const { payload, options } = job;

    // ============================================
    // 1. Extract payload data for write operations
    // ============================================
    const writePayload: WritePayloadData = {
      select: payload?.select,
      populate: payload?.populate,
    };

    // ============================================
    // 2. Process field selection (projection)
    // ============================================
    const attributesWithPopulate = parseFieldsProjection(
      writePayload.select || [],
    );

    // ============================================
    // 3. Process populate options
    // ============================================
    let populate: PopulateOptions[] = [];

    // Build populate tree from explicit populate fields
    if (writePayload.populate) {
      populate = buildPopulateTree(writePayload.populate);
    }

    // Merge populate options from field selection
    if (
      attributesWithPopulate.populate &&
      attributesWithPopulate.populate.length > 0
    ) {
      populate = [...populate, ...attributesWithPopulate.populate];
    }

    // ============================================
    // 4. Construct final MongoDB options
    // ============================================
    job.options = {
      populate,
      projection: attributesWithPopulate.select || undefined,
      ...options, // Preserve any existing options
    };

    return await original.call(this, job);
  };
};

/**
 * Decorator for converting request job.payload to job.options for delete operations.
 *
 * This decorator processes the delete mode from the payload and sets the hardDelete option:
 * - mode: 'soft' -> hardDelete: false (logical deletion, marks as deleted)
 * - mode: 'hard' -> hardDelete: true (physical deletion, removes from database)
 * - mode: undefined -> hardDelete: false (defaults to soft delete)
 *
 * @param _target - The target object (unused)
 * @param _methodName - The method name (unused)
 * @param descriptor - The property descriptor of the method being decorated
 *
 * @example
 * ```typescript
 * class UserService extends ModelService<User> {
 *   @DeletePayload
 *   async delete(job: MongoJob<User, ApiQueryDelete>) {
 *     // job.options.hardDelete will be set based on payload.mode
 *     return this.db.deleteRecord(job);
 *   }
 * }
 * ```
 */
export const DeletePayload = <M extends MongoSchema>(
  _target: unknown,
  _methodName: string,
  descriptor: TypedPropertyDescriptor<AsyncMethodDecorator<M, ApiQueryDelete>>,
): void => {
  const original = descriptor.value;
  if (!original) return;

  descriptor.value = async function wrapper(
    this: ModelService<M>,
    job: MongoJob<M, ApiQueryDelete>,
  ): Promise<unknown> {
    const { payload, options } = job;

    // ============================================
    // 1. Extract delete mode from payload
    // ============================================
    const deletePayload: DeletePayloadData = {
      mode: payload?.mode,
    };

    // ============================================
    // 2. Determine hard delete flag
    // ============================================
    const hardDelete = deletePayload.mode && deletePayload.mode === 'hard';

    // ============================================
    // 3. Construct final MongoDB options
    // ============================================
    job.options = {
      hardDelete,
      ...options, // Preserve any existing options
    };

    return await original.call(this, job);
  };
};
