import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
/**
 * Custom validator to check if a value is equal to another property value.
 *
 * @param property - The property name to compare with
 * @param validationOptions - Optional class-validator options
 * @returns Property decorator function
 *
 * @example
 * class ExampleDto {
 *   @IsEqual('password')
 *   confirmPassword: string;
 *   password: string;
 * }
 */
export function IsEqual(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEqual',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: {
        message: i18nValidationMessage('validation.isEqual'),
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          return value === relatedValue;
        },
      },
    });
  };
}
/**
 * Custom validator to check if a value is NOT equal to another property value.
 *
 * @param property - The property name to compare with
 * @param validationOptions - Optional class-validator options
 * @returns Property decorator function
 */
export function IsNotEqual(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotEqual',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: {
        message: i18nValidationMessage('validation.isNotEqual'),
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          return value !== relatedValue;
        },
      },
    });
  };
}
/**
 * Custom validator to check if a value is greater than another property value.
 * Supports numbers and Date objects.
 *
 * @param property - The property name to compare with
 * @param validationOptions - Optional class-validator options
 * @returns Property decorator function
 */
export function IsGreaterThan(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isGreaterThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: {
        message: i18nValidationMessage('validation.isGreaterThan'),
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          return (
            typeof value === 'undefined' ||
            (value instanceof Date &&
              relatedValue instanceof Date &&
              new Date(value).valueOf() > new Date(relatedValue).valueOf()) ||
            (typeof value === 'number' &&
              typeof relatedValue === 'number' &&
              value > relatedValue)
          );
        },
      },
    });
  };
}
/**
 * Custom validator to check if a value is greater than or equal to another property value.
 * Supports numbers and Date objects.
 *
 * @param property - The property name to compare with
 * @param validationOptions - Optional class-validator options
 * @returns Property decorator function
 */
export function IsGreaterThanEqual(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isGreaterThanEqual',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: {
        message: i18nValidationMessage('validation.isGreaterThanEqual'),
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          return (
            typeof value === 'undefined' ||
            (value instanceof Date &&
              relatedValue instanceof Date &&
              new Date(value).valueOf() >= new Date(relatedValue).valueOf()) ||
            (typeof value === 'number' &&
              typeof relatedValue === 'number' &&
              value >= relatedValue)
          );
        },
      },
    });
  };
}
/**
 * Custom validator to check if a value is less than another property value.
 * Supports numbers and Date objects.
 *
 * @param property - The property name to compare with
 * @param validationOptions - Optional class-validator options
 * @returns Property decorator function
 */
export function IsLessThan(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLessThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: {
        message: i18nValidationMessage('validation.isLessThan'),
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          return (
            typeof value === 'undefined' ||
            (value instanceof Date &&
              relatedValue instanceof Date &&
              new Date(value).valueOf() < new Date(relatedValue).valueOf()) ||
            (typeof value === 'number' &&
              typeof relatedValue === 'number' &&
              value < relatedValue)
          );
        },
      },
    });
  };
}
/**
 * Custom validator to check if a value is less than or equal to another property value.
 * Supports numbers and Date objects.
 *
 * @param property - The property name to compare with
 * @param validationOptions - Optional class-validator options
 * @returns Property decorator function
 */
export function IsLessThanEqual(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLessThanEqual',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: {
        message: i18nValidationMessage('validation.isLessThanEqual'),
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          return (
            typeof value === 'undefined' ||
            (value instanceof Date &&
              relatedValue instanceof Date &&
              new Date(value).valueOf() <= new Date(relatedValue).valueOf()) ||
            (typeof value === 'number' &&
              typeof relatedValue === 'number' &&
              value <= relatedValue)
          );
        },
      },
    });
  };
}
/**
 * Custom validator to check if a value is a valid scope array.
 * Accepts an array of strings or arrays where the first element is a string and the rest are strings or numbers.
 *
 * @param validationOptions - Optional class-validator options
 * @returns Property decorator function
 */
export function IsValidScope(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidScope',
      target: object.constructor,
      propertyName,
      options: {
        message: i18nValidationMessage('validation.isValidScope'),
        ...validationOptions,
      },
      validator: {
        validate(value: unknown[]) {
          if (!Array.isArray(value)) return false;
          return value.every(
            (v) =>
              typeof v === 'string' ||
              (Array.isArray(v) &&
                v.length > 0 &&
                typeof v[0] === 'string' &&
                v
                  .slice(1)
                  .every(
                    (item) =>
                      typeof item === 'string' || typeof item === 'number',
                  )),
          );
        },
      },
    });
  };
}
/**
 * Custom validator to check if a value is a string or a non-empty array of strings.
 *
 * @param validationOptions - Optional class-validator options
 * @returns Property decorator function
 */
export function IsStringOrStringArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStringOrStringArray',
      target: object.constructor,
      propertyName,
      options: {
        message: i18nValidationMessage('validation.isStringOrStringArray'),
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'string' ||
            (Array.isArray(value) &&
              value.length > 0 &&
              value.every((item) => typeof item === 'string'))
          );
        },
      },
    });
  };
}
/**
 * Recursively validates if a value is a valid primitive, array, or object with string keys and valid values.
 * Used internally for IsValidWhere.
 *
 * @param value - The value to validate
 * @returns True if valid, false otherwise
 */
function validateValue(value: unknown): boolean {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(validateValue);
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).every(
      ([key, val]) => typeof key === 'string' && validateValue(val),
    );
  }
  return false;
}

/**
 * Custom validator to check if a value is a valid "where" object for filtering.
 * The object must have string keys and values that are string, number, boolean, null, array, or object (recursively).
 *
 * @param validationOptions - Optional class-validator options
 * @returns Property decorator function
 */
export function IsValidWhere(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidWhere',
      target: object.constructor,
      propertyName,
      options: {
        message: i18nValidationMessage('validation.isValidWhere'),
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (!value || typeof value !== 'object' || Array.isArray(value))
            return false;
          return Object.entries(value).every(
            ([key, val]) => typeof key === 'string' && validateValue(val),
          );
        },
      },
    });
  };
}
