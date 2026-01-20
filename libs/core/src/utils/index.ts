import moment from 'moment-timezone';
import pluralize from 'pluralize-esm';
import { v1 as uuidv1 } from 'uuid';

/**
 * Adds the specified number of days to the current date.
 *
 * @param days - Number of days to add (can be negative to subtract days)
 * @returns A new Date object representing the calculated date
 *
 * @example
 * const futureDate = addDays(7); // 7 days from now
 * const pastDate = addDays(-3);  // 3 days ago
 */
export const addDays = (days: number): Date => {
  return moment().add(days, 'days').toDate();
};

/**
 * Safely parses a JSON string and returns the parsed object or false if parsing fails.
 *
 * @param str - The JSON string to parse
 * @returns The parsed object of type T, or false if parsing fails
 *
 * @example
 * const data = parseJSON<{name: string}>('{"name": "John"}'); // {name: "John"}
 * const invalid = parseJSON('invalid json'); // false
 */
export const parseJSON = <T = unknown>(str: string): T | false => {
  try {
    return JSON.parse(str) as T;
  } catch {
    // Return false if parsing fails
    return false;
  }
};

/**
 * Transforms JSON string values to parsed objects or returns the original value.
 * Used for query parameters that may be passed as JSON strings in HTTP requests.
 *
 * @param value - The value to transform (typically from class-transformer)
 * @param allowNonJSON - If true, returns the original string when JSON parsing fails; if false, returns false
 * @returns The parsed object if value is a valid JSON string, the original value if not a string,
 *          or false/original string (based on allowNonJSON) if JSON parsing fails
 *
 * @example
 * transformJSON({ value: '{"key": "value"}' }); // {key: "value"}
 * transformJSON({ value: 42 }); // 42
 * transformJSON({ value: 'plain string' }); // false (invalid JSON)
 * transformJSON({ value: 'plain string', allowNonJSON: true }); // 'plain string'
 */
export const transformJSON = ({
  value,
  allowNonJSON,
}: {
  value: unknown;
  allowNonJSON?: boolean;
}): unknown => {
  return typeof value === 'string'
    ? allowNonJSON
      ? parseJSON<unknown>(value) || value
      : parseJSON<unknown>(value)
    : value;
};

/**
 * Returns the plural form of a given string.
 *
 * @param str - The string to pluralize
 * @returns The pluralized string
 *
 * @example
 * pluralizeString('user'); // 'users'
 * pluralizeString('child'); // 'children'
 * pluralizeString('person'); // 'people'
 */
export const pluralizeString = (str: string): string => pluralize(str);

/**
 * Converts a string to snake_case.
 *
 * Splits the string at uppercase letters and joins with underscores,
 * then converts the entire string to lowercase.
 *
 * @param str - The string to convert
 * @returns The snake_cased string
 *
 * @example
 * snakeCase('UserName'); // 'user_name'
 * snakeCase('firstName'); // 'first_name'
 * snakeCase('HTTPRequest'); // 'h_t_t_p_request'
 */
export const snakeCase = (str: string): string =>
  str
    .split(/(?=[A-Z])/) // Split before each uppercase letter
    .join('_') // Join with underscores
    .toLowerCase(); // Convert to lowercase

/**
 * Checks if the current process is the primary instance in a PM2 cluster.
 *
 * This is useful when running multiple instances of the application with PM2.
 * Only the primary instance (instance 0) will return true.
 *
 * @returns True if this is the primary instance or not running in cluster mode
 *
 * @example
 * if (isPrimaryInstance()) {
 *   // Run scheduled tasks only on primary instance
 *   scheduleCronJobs();
 * }
 */
export const isPrimaryInstance = (): boolean =>
  typeof process.env.NODE_APP_INSTANCE === 'undefined' ||
  process.env.NODE_APP_INSTANCE === '0';

/**
 * Generates a version 1 UUID (timestamp-based).
 *
 * Uses the UUID v1 algorithm which creates a unique identifier based on
 * timestamp and machine MAC address.
 *
 * @returns A string representing a UUID v1
 *
 * @example
 * const id = uuid(); // '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
 */
export const uuid = (): string => uuidv1();

/**
 * Generates a numeric OTP (One-Time Password) of specified length.
 *
 * In test mode (OTP_TEST_MODE='Y'), returns a sequential number (e.g., '123456' for length 6).
 * In production mode, generates a random numeric OTP of the specified length.
 *
 * @param length - The length of the OTP to generate (default: 6)
 * @returns A string representing the OTP
 *
 * @example
 * const otp1 = otp(); // '847392' (random 6-digit number)
 * const otp2 = otp(4); // '5829' (random 4-digit number)
 * // In test mode: otp(6) returns '123456'
 */
export const otp = (length = 6): string =>
  process.env.OTP_TEST_MODE === 'Y'
    ? Array(length)
        .fill(null)
        .map((e, i) => i + 1)
        .join('')
    : `${Math.floor(
        Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1),
      )}`;

export const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
