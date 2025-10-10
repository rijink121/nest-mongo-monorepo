import {
  EXCLUDE_TRIM_FIELDS_KEY,
  ExcludeTrimPrototype,
} from '@core/decorators/exclude-trim.decorator';
import { trimFields } from '@core/utils/validate';
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { isObject } from 'class-validator';

/**
 * Global pipe for automatically trimming string values in request bodies.
 *
 * This pipe processes incoming request data and automatically trims whitespace
 * from string values, while respecting exclusion rules defined by the
 * `@ExcludeTrim` decorator. It helps maintain data consistency by removing
 * unintentional whitespace from user inputs.
 *
 * Features:
 * - Automatically trims all string fields in request bodies
 * - Respects `@ExcludeTrim` decorator for field-specific exclusions
 * - Only processes request body data (ignores query params, headers, etc.)
 * - Preserves original data types and nested object structures
 *
 * @example Usage in controller
 * ```typescript
 * @Post()
 * @UsePipes(new TrimPipe())
 * async createUser(@Body() createUserDto: CreateUserDto) {
 *   // String fields in createUserDto will be automatically trimmed
 *   return this.userService.create(createUserDto);
 * }
 * ```
 *
 * @example Global usage in main.ts
 * ```typescript
 * app.useGlobalPipes(new TrimPipe());
 * ```
 */
@Injectable()
export class TrimPipe implements PipeTransform {
  /**
   * Transforms the incoming value by trimming string fields if applicable.
   *
   * The transformation logic:
   * 1. Only processes objects from request bodies with defined metatypes
   * 2. Checks for `@ExcludeTrim` decorator metadata on the target class
   * 3. If no exclusions or specific field exclusions are found, performs trimming
   * 4. If all fields are excluded (`@ExcludeTrim()` with no params), skips trimming
   *
   * @param value - The incoming request data to be processed
   * @param metadata - NestJS argument metadata containing type and metatype information
   * @returns The processed value with trimmed strings (if applicable)
   *
   * @example Input/Output example
   * ```typescript
   * // Input: { username: "  john_doe  ", email: "john@example.com  " }
   * // Output: { username: "john_doe", email: "john@example.com" }
   * ```
   */
  transform(value: unknown, { type, metatype }: ArgumentMetadata): unknown {
    // Early return for non-applicable cases
    if (!this.shouldProcessValue(value, type, metatype)) {
      return value;
    }

    // Extract exclusion metadata from the target class prototype
    const excludeTrimFields = this.getExclusionMetadata(metatype);

    // Apply trimming logic based on exclusion configuration
    return this.applyTrimming(
      value as Record<string, unknown>,
      excludeTrimFields,
    );
  }

  /**
   * Determines if the value should be processed by the trim pipe.
   *
   * @param value - The value to check
   * @param type - The argument type (body, query, param, etc.)
   * @param metatype - The class constructor for the target DTO (can be undefined)
   * @returns True if the value should be processed, false otherwise
   */
  private shouldProcessValue(
    value: unknown,
    type: string,
    metatype: (new (...args: unknown[]) => unknown) | undefined,
  ): metatype is new (...args: unknown[]) => unknown {
    // Only process objects from request bodies with defined metatypes
    return isObject(value) && type === 'body' && metatype !== undefined;
  }

  /**
   * Retrieves exclusion metadata from the target class prototype.
   *
   * @param metatype - The class constructor for the target DTO
   * @returns The exclusion configuration (string array or true) or undefined
   */
  private getExclusionMetadata(
    metatype: new (...args: unknown[]) => unknown,
  ): string[] | true | undefined {
    return (metatype.prototype as ExcludeTrimPrototype)[
      EXCLUDE_TRIM_FIELDS_KEY
    ];
  }

  /**
   * Applies trimming logic based on the exclusion configuration.
   *
   * @param value - The object to process
   * @param excludeTrimFields - The exclusion configuration
   * @returns The processed object with appropriate trimming applied
   */
  private applyTrimming(
    value: Record<string, unknown>,
    excludeTrimFields: string[] | true | undefined,
  ): Record<string, unknown> {
    // If excludeTrimFields is true, exclude all fields (no trimming)
    if (excludeTrimFields === true) {
      return value;
    }

    // If excludeTrimFields is an array, trim fields excluding those specified
    if (Array.isArray(excludeTrimFields)) {
      return trimFields(value, excludeTrimFields);
    }

    // If no exclusion metadata exists, trim all string fields
    return trimFields(value, []);
  }
}
