import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';

/**
 * Type guard to check if a value is a plain JavaScript object.
 *
 * @param value - The value to check
 * @returns True if the value is a plain object, false otherwise
 *
 * @example
 * isPlainObject({ name: 'John' }); // true
 * isPlainObject([1, 2, 3]); // false
 * isPlainObject(null); // false
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Trims whitespace from a string value and converts empty strings to null.
 *
 * @param value - The value to trim
 * @returns Trimmed string, null if empty after trimming, or the original value for non-strings
 *
 * @example
 * trimValue('  hello  '); // 'hello'
 * trimValue('   '); // null
 * trimValue(123); // 123
 */
function trimValue(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Convert empty strings to null after trimming
    return trimmed === '' ? null : trimmed;
  }
  return value;
}

/**
 * Recursively trims all string fields in an object, with support for nested objects and arrays.
 *
 * This function processes all string values in an object by trimming whitespace and converting
 * empty strings to null. It handles nested objects and arrays recursively while preserving
 * the original data structure. Certain fields can be excluded from trimming to preserve
 * their original values (e.g., passwords, API keys).
 *
 * @template T - The type of the payload object
 * @param payload - The object containing fields to be trimmed
 * @param exclude - Array of field names to exclude from trimming (default: [])
 * @returns A new object with trimmed string values
 * @throws Error if payload is not a plain object
 *
 * @example Basic usage
 * ```typescript
 * const input = { name: '  John  ', email: ' john@example.com ' };
 * const output = trimFields(input);
 * // Result: { name: 'John', email: 'john@example.com' }
 * ```
 *
 * @example Excluding fields
 * ```typescript
 * const input = { username: '  admin  ', password: '  secret  ' };
 * const output = trimFields(input, ['password']);
 * // Result: { username: 'admin', password: '  secret  ' }
 * ```
 *
 * @example Nested objects
 * ```typescript
 * const input = {
 *   user: { name: '  John  ', address: { city: '  NYC  ' } }
 * };
 * const output = trimFields(input);
 * // Result: { user: { name: 'John', address: { city: 'NYC' } } }
 * ```
 *
 * @example Arrays
 * ```typescript
 * const input = { tags: ['  tag1  ', '  tag2  '] };
 * const output = trimFields(input);
 * // Result: { tags: ['tag1', 'tag2'] }
 * ```
 */
export function trimFields<T extends Record<string, unknown>>(
  payload: T,
  exclude: string[] = [],
): T {
  // Validate input is a plain object
  if (!isPlainObject(payload)) {
    throw new Error('Value must be a plain object');
  }

  const result: Record<string, unknown> = {};

  // Process each field in the payload
  for (const [key, value] of Object.entries(payload)) {
    // Skip trimming for excluded fields
    if (exclude.includes(key)) {
      result[key] = value;
      continue;
    }

    // Handle nested objects recursively
    if (isPlainObject(value)) {
      result[key] = trimFields(value, exclude);
    }
    // Handle arrays of values
    else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        isPlainObject(item) ? trimFields(item, exclude) : trimValue(item),
      );
    }
    // Handle primitive values
    else {
      result[key] = trimValue(value);
    }
  }

  return result as T;
}

/**
 * Trims all string fields in a payload and validates it against a DTO class.
 *
 * This function combines field trimming with class-validator validation. It first trims
 * all string values in the payload (excluding specified fields), then creates an instance
 * of the provided DTO class, assigns the trimmed values, and runs validation. If validation
 * fails, it throws a BadRequestException with detailed error information.
 *
 * Validation Options:
 * - `whitelist: true` - Strips properties not defined in the DTO
 * - `validationError: { target: false }` - Excludes the validated object from error details
 *
 * @template T - The DTO class type
 * @param dtoClass - The DTO class constructor to instantiate and validate against
 * @param payload - The raw payload object to be trimmed and validated
 * @param exclude - Optional array of field names to exclude from trimming
 * @returns Promise resolving to a validated DTO instance
 * @throws BadRequestException if validation fails
 *
 * @example Basic usage
 * ```typescript
 * class LoginDto {
 *   @IsEmail()
 *   email: string;
 *
 *   @IsString()
 *   @MinLength(8)
 *   password: string;
 * }
 *
 * const payload = { email: '  user@example.com  ', password: 'secret123' };
 * const dto = await trimAndValidate(LoginDto, payload);
 * // Result: LoginDto { email: 'user@example.com', password: 'secret123' }
 * ```
 *
 * @example Excluding password from trimming
 * ```typescript
 * const payload = {
 *   username: '  admin  ',
 *   password: '  mypass  ' // Preserve leading/trailing spaces
 * };
 * const dto = await trimAndValidate(AuthDto, payload, ['password']);
 * // Result: AuthDto { username: 'admin', password: '  mypass  ' }
 * ```
 *
 * @example Validation error handling
 * ```typescript
 * try {
 *   const dto = await trimAndValidate(UserDto, invalidPayload);
 * } catch (error) {
 *   // BadRequestException with validation errors
 *   console.error(error.response);
 * }
 * ```
 */
export async function trimAndValidate<T extends object>(
  dtoClass: new () => T,
  payload: Record<string, unknown>,
  exclude?: string[],
): Promise<T> {
  // Create a new instance of the DTO class
  const dtoObj = new dtoClass();

  // Trim all string fields in the payload (excluding specified fields)
  const trimmedPayload = trimFields(payload, exclude);

  // Assign the trimmed payload to the DTO instance
  Object.assign(dtoObj, trimmedPayload);

  // Run class-validator validations on the DTO
  const errors = await validate(dtoObj, {
    whitelist: true, // Strip properties not in the DTO
    validationError: { target: false }, // Exclude target from error details for security
  });

  // Throw exception if validation fails
  if (errors.length > 0) {
    throw new BadRequestException(errors);
  }

  return dtoObj;
}
