/**
 * Metadata key for storing trim exclusion configuration on class prototypes.
 * This constant ensures consistent metadata storage and retrieval across the application.
 */
export const EXCLUDE_TRIM_FIELDS_KEY = 'exclude_trim_fields';

/**
 * Type definition for class prototypes that have trim exclusion metadata.
 *
 * @property {string[] | true} [EXCLUDE_TRIM_FIELDS_KEY] - Either an array of field names to exclude
 *                                                        or `true` to exclude all fields from trimming
 */
export type ExcludeTrimPrototype = {
  [EXCLUDE_TRIM_FIELDS_KEY]: string[] | true;
};

/**
 * Class decorator for excluding fields from the global TrimPipe transformation.
 *
 * This decorator allows you to control which fields should be excluded from automatic
 * string trimming when processing request bodies. It can be used to exclude all fields
 * or specific fields from trimming operations.
 *
 * @param fields - Variable number of field names to exclude from trimming.
 *                 If no fields are provided, all fields will be excluded.
 *
 * @returns A class decorator function that applies the trim exclusion metadata
 *
 * @example Exclude all fields from trimming
 * ```typescript
 * @ExcludeTrim()
 * class CreateUserDto {
 *   username: string;
 *   password: string; // Will not be trimmed
 * }
 * ```
 *
 * @example Exclude specific fields from trimming
 * ```typescript
 * @ExcludeTrim('password', 'secretKey')
 * class LoginDto {
 *   username: string;    // Will be trimmed
 *   password: string;    // Will not be trimmed
 *   secretKey: string;   // Will not be trimmed
 * }
 * ```
 *
 * @example Multiple field exclusion
 * ```typescript
 * @ExcludeTrim('token', 'hash', 'signature')
 * class AuthDto {
 *   email: string;     // Will be trimmed
 *   token: string;     // Will not be trimmed
 *   hash: string;      // Will not be trimmed
 *   signature: string; // Will not be trimmed
 * }
 * ```
 */
export function ExcludeTrim<T extends new (...args: unknown[]) => unknown>(
  ...fields: string[]
) {
  return function (constructor: T): void {
    // Determine exclusion strategy based on provided fields
    const exclusionValue = fields.length > 0 ? fields : true;

    // Apply metadata to the constructor's prototype for later retrieval by TrimPipe
    (constructor.prototype as ExcludeTrimPrototype)[EXCLUDE_TRIM_FIELDS_KEY] =
      exclusionValue;
  };
}
