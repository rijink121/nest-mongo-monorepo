import {
  IsStringOrStringArray,
  IsValidScope,
  IsValidWhere,
} from '@core/decorators/validation.decorator';
import { transformJSON } from '@core/utils';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * Base API Query DTO for handling common query parameters.
 * Provides pagination, filtering, sorting, and data selection capabilities.
 */
export class ApiQuery {
  @ApiProperty({
    type: Number,
    description: 'Offset for Pagination',
    examples: {
      default: {
        summary: 'Default offset',
        value: 0,
      },
      custom: {
        summary: 'Custom offset',
        value: 25,
      },
    },
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  /** Number of records to skip for pagination */
  offset: number;

  @ApiProperty({
    type: Number,
    description: 'Limit for Pagination',
    examples: {
      default: {
        summary: 'Default limit',
        value: 10,
      },
      custom: {
        summary: 'Custom limit',
        value: 25,
      },
      empty: {
        summary: 'Without limit',
        value: -1,
      },
    },
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(-1)
  /** Maximum number of records to return (-1 for no limit) */
  limit: number;

  @ApiProperty({
    type: String,
    description: 'Search Keyword',
    examples: {
      empty: {
        summary: 'No search',
      },
      default: {
        summary: 'Search string',
        value: 'search text',
      },
      scope: {
        summary: 'Search with scope',
        value: JSON.stringify(['scope', 'search text']),
      },
    },
    required: false,
  })
  @Transform(({ value }) => transformJSON({ value, allowNonJSON: true }))
  @IsOptional()
  @IsStringOrStringArray()
  /** Search keyword or array containing scope and search term */
  search: string | string[];

  @ApiProperty({
    type: String,
    description: 'Select fields to return',
    examples: {
      empty: {
        summary: 'Select all fields',
      },
      specific: {
        summary: 'Select specific fields',
        value: JSON.stringify(['id', 'name']),
      },
      populate: {
        summary: 'Select specific fields from populate',
        value: JSON.stringify([
          'id',
          'name',
          'populate_1.id',
          'populate_1.title',
        ]),
      },
    },
    required: false,
  })
  @Transform(transformJSON)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  /** Array of field names to include in response */
  select: string[];

  @ApiProperty({
    type: String,
    description: 'Where conditions for filtering records',
    examples: {
      empty: {
        summary: 'All records',
      },
      equals: {
        summary: 'Equal conditions',
        value: JSON.stringify({
          field_1: 'value',
          field_2: true,
          field_3: null,
        }),
      },
      others: {
        summary: 'Other conditions',
        value: JSON.stringify({
          field_1: { $ne: 'value' },
          field_2: { $gte: 5, $lte: 10 },
          field_3: { $in: [1, 2], $notIn: [3, 4] },
        }),
      },
      populate: {
        summary: 'Populate conditions',
        value: JSON.stringify({
          '$populate_1.field_1$': 'value',
          '$populate_1.field_2$': { $gte: 5, $lte: 10 },
          '$populate_2.field_3$': { $in: [1, 2], $notIn: [3, 4] },
        }),
      },
    },
    required: false,
  })
  @Transform(transformJSON)
  @IsOptional()
  @IsValidWhere()
  /** Filter conditions object with field-value pairs and operators */
  where: Record<
    string,
    string | number | boolean | null | unknown[] | Record<string, unknown>
  >;

  @ApiProperty({
    type: String,
    description: 'Populate Relations',
    examples: {
      empty: {
        summary: 'No populate',
      },
      simple: {
        summary: 'Direct populate',
        value: JSON.stringify(['populate_1', 'populate_2']),
      },
      nested: {
        summary: 'Nested populate',
        value: JSON.stringify([
          'populate_1',
          'populate_1.child_populate_1',
          'populate_1.child_populate_2',
        ]),
      },
    },
    required: false,
  })
  @Transform(transformJSON)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  /** Array of relation names to populate in the response */
  populate: string[];

  @ApiProperty({
    type: String,
    description: 'Scope (Predefined Conditions)',
    examples: {
      empty: {
        summary: 'No scope',
      },
      simple: {
        summary: 'With scope',
        value: JSON.stringify(['scope_1', 'scope_2']),
      },
      advanced: {
        summary: 'With scope and options',
        value: JSON.stringify([['scope_1', 'option_1', 'option_2'], 'scope_2']),
      },
    },
    required: false,
  })
  @Transform(transformJSON)
  @IsOptional()
  @IsArray()
  @IsValidScope()
  /** Array of predefined scopes with optional parameters */
  scope: (string | [string, ...(string | number)[]])[];

  @ApiProperty({
    type: String,
    description: 'Sort order of records',
    examples: {
      empty: {
        summary: 'Default sort',
      },
      single: {
        summary: 'Sort single',
        value: JSON.stringify(['field_1']),
      },
      multi: {
        summary: 'Sort multi',
        value: JSON.stringify(['field_1', 'field_2']),
      },
      desc: {
        summary: 'Sort direction',
        value: JSON.stringify([
          ['field_1', 'desc'],
          ['field_2', 'asc'],
        ]),
      },
      populate: {
        summary: 'Sort populate',
        value: JSON.stringify([
          ['populate_1', 'field_1', 'desc'],
          ['populate_2', 'field_2', 'asc'],
        ]),
      },
    },
    required: false,
  })
  @Transform(transformJSON)
  @IsOptional()
  @IsArray()
  @IsStringOrStringArray({ each: true })
  /** Array of sort criteria with field names and optional direction */
  sort: (string | string[])[];
}

/**
 * DTO for create operation queries.
 * Only includes populate for relation handling during creation.
 */
export class ApiQueryCreate extends PickType(ApiQuery, ['populate']) {}

/**
 * DTO for update operation queries.
 * Only includes populate for relation handling during updates.
 */
export class ApiQueryUpdate extends PickType(ApiQuery, ['populate']) {}

/**
 * DTO for get all records operation.
 * Includes all query parameters for comprehensive data retrieval.
 */
export class ApiQueryGetAll extends ApiQuery {}

/**
 * DTO for count all records operation.
 * Includes filtering and scope parameters but excludes pagination and sorting.
 */
export class ApiQueryCountAll extends PickType(ApiQuery, [
  'search',
  'where',
  'populate',
  'scope',
]) {}

/**
 * DTO for find one record operation.
 * Excludes limit but includes all other query parameters.
 */
export class ApiQueryGetOne extends PickType(ApiQuery, [
  'offset',
  'search',
  'select',
  'where',
  'populate',
  'scope',
  'sort',
]) {}

/**
 * DTO for get by ID operation.
 * Excludes pagination and filtering (ID is the primary filter).
 */
export class ApiQueryGetById extends PickType(ApiQuery, [
  'select',
  'populate',
  'scope',
]) {}

/**
 * DTO for delete operation queries.
 * Provides options for soft or hard delete modes.
 */
export class ApiQueryDelete {
  @ApiProperty({
    type: String,
    description: 'Delete mode',
    examples: {
      soft: {
        summary: 'Soft delete mode',
        value: 'soft',
      },
      hard: {
        summary: 'Hard delete mode',
        value: 'hard',
      },
    },
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEnum(['soft', 'hard'])
  /** Delete mode: 'soft' for logical deletion, 'hard' for physical deletion */
  mode?: 'soft' | 'hard';
}
