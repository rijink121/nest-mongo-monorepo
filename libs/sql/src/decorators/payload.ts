import {
  ApiQuery,
  ApiQueryCreate,
  ApiQueryDelete,
} from '@core/definitions/api-query.dto';
import { BadRequestException } from '@nestjs/common';
import { isObject } from 'class-validator';
import { IncludeOptions, Op, Order, WhereOptions } from 'sequelize';
import {
  ModelService,
  SearchField,
  SearchFieldWithPopulate,
} from '../model.service';
import {
  buildPopulateTree,
  mapOperatorToQuery,
  parseFieldsProjection,
} from '../utils';
import type { SqlJob } from '../utils/job';
import type { SqlSchema } from '../utils/schema';

/**
 * Type definition for async methods that can be decorated with @ReadPayload.
 */
type AsyncMethodDecorator<M extends SqlSchema, T> = (
  this: ModelService<M>,
  job: SqlJob<M, T>,
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
 * SqlDB-compatible options, including:
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
 *   async findAll(job: SqlJob<User, ApiQuery>) {
 *     // job.options will be populated from job.payload
 *     return this.db.getAllRecords(job);
 *   }
 * }
 * ```
 */
export const ReadPayload = <M extends SqlSchema>(
  _target: unknown,
  _methodName: string,
  descriptor: TypedPropertyDescriptor<AsyncMethodDecorator<M, ApiQuery>>,
): void => {
  const original = descriptor.value;
  if (!original) return;

  descriptor.value = async function wrapper(
    this: ModelService<M>,
    job: SqlJob<M, ApiQuery>,
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
      scope: payload?.scope,
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
    const where: WhereOptions<M> = { [Op.and]: [] };
    const whereAnd = where[Op.and] as WhereOptions<M>[];
    if (readPayload.where) {
      whereAnd.push(mapOperatorToQuery(readPayload.where) as WhereOptions<M>);
    }

    // ============================================
    // 4. Process populate options
    // ============================================
    let include: IncludeOptions[] = [];

    // Build populate tree from explicit populate fields
    if (readPayload.populate) {
      include = buildPopulateTree(readPayload.populate);
    }

    // Merge populate options from field selection
    if (
      attributesWithPopulate.include &&
      attributesWithPopulate.include.length > 0
    ) {
      include = [...include, ...attributesWithPopulate.include];
    }

    // ============================================
    // 5. Process search functionality
    // ============================================
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
          ? Array.isArray(this.searchFields[searchScope])
            ? (this.searchFields[searchScope] as SearchField<M>[])
            : (this.searchFields[searchScope] as SearchFieldWithPopulate<M>)
                .fields
          : (this.searchFields as SearchField<M>[]);

      // Escape special regex characters for safe pattern matching
      const escapedSearchKey = searchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Create OR conditions for case-insensitive search across all search fields
      const searchConditions = searchFields.map(
        (field) =>
          ({
            [field]: { [Op.iLike]: `%${escapedSearchKey}%` },
          }) as WhereOptions<M>,
      );

      whereAnd.push({ [Op.or]: searchConditions });

      // Handle additional population requirements for specific search scopes
      const searchPopulate =
        isObject(this.searchFields) && isObject(this.searchFields[searchScope])
          ? (this.searchFields[searchScope] as SearchFieldWithPopulate<M>)
              .populate
          : this.searchPopulate;

      if (searchPopulate.length > 0) {
        for (let index = 0; index < searchPopulate.length; index++) {
          const association = searchPopulate[index];
          if (isObject(association)) {
            include.push(association as IncludeOptions);
          } else if (typeof association === 'string') {
            const associationIndex = include.findIndex(
              (x) => (x.association || x) === association,
            );
            if (associationIndex === -1) {
              include.push({ association, include: [] });
            }
          }
        }
      }
    }

    // ============================================
    // 6. Construct final SqlDB options
    // ============================================
    job.options = {
      where,
      include,
      order: readPayload.sort as Order,
      attributes:
        attributesWithPopulate.attributes.length > 0
          ? attributesWithPopulate.attributes
          : undefined,
      offset: readPayload.offset,
      limit: readPayload.limit,
      scope: readPayload.scope || [],
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
 *   async create(job: SqlJob<User, ApiQuery>) {
 *     // job.options will be populated with populate and projection
 *     return this.db.createRecord(job);
 *   }
 *
 *   @WritePayload
 *   async update(job: SqlJob<User, ApiQuery>) {
 *     // job.options will be populated from job.payload
 *     return this.db.updateRecord(job);
 *   }
 * }
 * ```
 */
export const WritePayload = <M extends SqlSchema>(
  _target: unknown,
  _methodName: string,
  descriptor: TypedPropertyDescriptor<AsyncMethodDecorator<M, ApiQueryCreate>>,
): void => {
  const original = descriptor.value;
  if (!original) return;

  descriptor.value = async function wrapper(
    this: ModelService<M>,
    job: SqlJob<M, ApiQueryCreate>,
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
    let include: IncludeOptions[] = [];

    // Build populate tree from explicit populate fields
    if (writePayload.populate) {
      include = buildPopulateTree(writePayload.populate);
    }

    // Merge populate options from field selection
    if (
      attributesWithPopulate.include &&
      attributesWithPopulate.include.length > 0
    ) {
      include = [...include, ...attributesWithPopulate.include];
    }

    // ============================================
    // 4. Construct final SqlDB options
    // ============================================
    job.options = {
      include,
      attributes:
        attributesWithPopulate.attributes.length > 0
          ? attributesWithPopulate.attributes
          : undefined,
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
 *   async delete(job: SqlJob<User, ApiQueryDelete>) {
 *     // job.options.hardDelete will be set based on payload.mode
 *     return this.db.deleteRecord(job);
 *   }
 * }
 * ```
 */
export const DeletePayload = <M extends SqlSchema>(
  _target: unknown,
  _methodName: string,
  descriptor: TypedPropertyDescriptor<AsyncMethodDecorator<M, ApiQueryDelete>>,
): void => {
  const original = descriptor.value;
  if (!original) return;

  descriptor.value = async function wrapper(
    this: ModelService<M>,
    job: SqlJob<M, ApiQueryDelete>,
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
    // 3. Construct final SqlDB options
    // ============================================
    job.options = {
      force: hardDelete,
      ...options, // Preserve any existing options
    };

    return await original.call(this, job);
  };
};
