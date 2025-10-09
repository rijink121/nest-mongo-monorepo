import { BadRequestException, Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, validateSync, ValidationError } from 'class-validator';

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

/**
 * Recursively flattens validation errors into readable string messages.
 *
 * This function processes nested ValidationError objects from class-validator
 * and converts them into flat array of human-readable error messages. It handles
 * nested object validation by building property paths and collecting all constraint
 * violations at any level of nesting.
 *
 * @param errors - Array of ValidationError objects from class-validator
 * @param parent - Parent property path for nested objects (used internally)
 * @returns Array of formatted error messages
 *
 * @example Single level errors
 * ```typescript
 * const errors = [
 *   { property: 'email', constraints: { isEmail: 'email must be an email' } }
 * ];
 * const messages = flattenValidationErrors(errors);
 * // Result: ['- email: email must be an email']
 * ```
 *
 * @example Nested object errors
 * ```typescript
 * const errors = [
 *   {
 *     property: 'user',
 *     children: [
 *       { property: 'name', constraints: { isNotEmpty: 'name should not be empty' } }
 *     ]
 *   }
 * ];
 * const messages = flattenValidationErrors(errors);
 * // Result: ['- user.name: name should not be empty']
 * ```
 */
export function flattenValidationErrors(
  errors: ValidationError[],
  parent = '',
): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    // Build the full property path (e.g., 'user.address.street')
    const propertyPath = parent
      ? `${parent}.${error.property}`
      : error.property;

    // Process direct constraint violations
    if (error.constraints) {
      for (const msg of Object.values(error.constraints)) {
        messages.push(`- ${propertyPath}: ${msg}`);
      }
    }

    // Recursively process nested object validation errors
    if (error.children && error.children.length > 0) {
      messages.push(...flattenValidationErrors(error.children, propertyPath));
    }
  }

  return messages;
}

/**
 * Validates environment configuration against a class model with class-validator decorators.
 *
 * This function is specifically designed for environment variable validation at application
 * startup. It transforms raw environment configuration into a strongly-typed class instance,
 * applies validation rules, and provides detailed error messages if validation fails.
 *
 * Key features:
 * - Automatic type conversion (strings to numbers/booleans as needed)
 * - Comprehensive validation using class-validator decorators
 * - Detailed error reporting with property paths
 * - Strict validation (no missing properties allowed)
 *
 * @template T - The environment configuration class type
 * @param model - The class constructor with validation decorators
 * @param config - Raw environment configuration object (usually from process.env)
 * @returns Validated and typed configuration instance
 * @throws Error with detailed validation messages if validation fails
 *
 * @example Environment validation class
 * ```typescript
 * class AppConfig {
 *   @IsString()
 *   @IsNotEmpty()
 *   NODE_ENV: string;
 *
 *   @IsNumber()
 *   @Min(1024)
 *   @Max(65535)
 *   PORT: number;
 *
 *   @IsUrl()
 *   DATABASE_URL: string;
 * }
 * ```
 *
 * @example Usage
 * ```typescript
 * const config = validateEnvConfig(AppConfig, process.env);
 * // Returns typed AppConfig instance with validated properties
 * ```
 *
 * @example Error handling
 * ```typescript
 * try {
 *   const config = validateEnvConfig(AppConfig, process.env);
 * } catch (error) {
 *   console.error('Environment validation failed:', error.message);
 *   // Output: Invalid environment configuration:
 *   // - PORT: must be a number
 *   // - DATABASE_URL: must be a URL
 * }
 * ```
 */
export function validateEnvConfig<T extends object>(
  model: Type<T>,
  config: Record<string, unknown>,
) {
  // Transform plain object to class instance with automatic type conversion
  const validatedConfig = plainToInstance(model, config, {
    enableImplicitConversion: true, // Convert strings to numbers/booleans
  });

  // Run synchronous validation (suitable for startup validation)
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false, // Require all properties to be present
  });

  // Handle validation failures
  if (errors.length > 0) {
    // Convert complex validation errors into readable messages
    const messages = flattenValidationErrors(errors);

    // Throw error with comprehensive validation feedback
    throw new Error(
      `Invalid environment configuration:\n${messages.join('\n')}`,
    );
  }

  return validatedConfig;
}
