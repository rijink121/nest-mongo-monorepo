import moment from 'moment-timezone';
import pluralize from 'pluralize-esm';
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
 * Safely parses a JSON string and returns the parsed object or undefined if parsing fails.
 *
 * @param str - The JSON string to parse
 * @returns The parsed object of type T, or undefined if parsing fails
 *
 * @example
 * const data = parseJSON<{name: string}>("{\"name\": \"John\"}"); // {name: "John"}
 * const invalid = parseJSON('invalid json'); // undefined
 */
export const parseJSON = <T = unknown>(str: string): T | undefined => {
  try {
    return JSON.parse(str) as T;
  } catch {
    // Return undefined if parsing fails
    return undefined;
  }
};
/**
 * Transforms JSON string values to parsed objects or returns the original value if not a string.
 * Used for query parameters that may be passed as JSON strings in HTTP requests.
 *
 * @param value - The value to transform (typically from class-transformer)
 * @returns The parsed object if value is a JSON string, otherwise the original value
 *
 * @example
 * transformJSON({ value: '{"key": "value"}' }); // {key: "value"}
 * transformJSON({ value: 42 }); // 42
 * transformJSON({ value: 'plain string' }); // undefined (invalid JSON)
 */
export const transformJSON = ({ value }: { value: unknown }): unknown => {
  return typeof value === 'string' ? parseJSON<unknown>(value) : value;
};
/**
 * Returns the plural form of a given string.
 *
 * @param str - The string to pluralize
 * @returns The pluralized string
 *
 * @example
 * pluralizeString('user'); // 'users'
 */
export const pluralizeString = (str: string): string => pluralize(str);

/**
 * Converts a string to snake_case.
 *
 * @param str - The string to convert
 * @returns The snake_cased string
 *
 * @example
 * snakeCase('UserName'); // 'user_name'
 */

export const snakeCase = (str: string): string =>
  str
    .split(/(?=[A-Z])/)
    .join('_')
    .toLowerCase();
