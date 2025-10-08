import { MongoJobOptions } from '@lib/mongo/utils/job';
import { MongoSchema } from '@lib/mongo/utils/schema';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Request } from 'express';
import { Connection } from 'mongoose';
import { CLS_REQ, ClsService, ClsStore } from 'nestjs-cls';

/**
 * Type-safe interface for validation arguments specific to unique validation.
 * Provides proper typing for the constraints array.
 */
interface UniqueValidationArguments<M> {
  property: string;
  constraints: (string | UniqueValidatorOptions<M>)[];
  object: Record<string, unknown>;
}

/**
 * Custom validator for checking field uniqueness in MongoDB collections.
 * Supports both simple model name validation and advanced options with custom where conditions.
 * Integrates with NestJS dependency injection and class-validator decorators.
 */
@ValidatorConstraint({ name: 'isUnique', async: true })
@Injectable()
export class UniqueValidator<M> implements ValidatorConstraintInterface {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly cls: ClsService<ClsStore>,
  ) {}

  /**
   * Validates that a value is unique for a given model and field.
   * Supports both simple model name validation and advanced options with custom where conditions.
   * Automatically excludes the current document when validating updates (PUT requests).
   */
  async validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    const req = this.cls.get<Request>(CLS_REQ);
    const {
      property,
      constraints: [modelNameOrOption],
    } = args as UniqueValidationArguments<M>;

    // Allow undefined values to pass (use @IsNotEmpty for required validation)
    if (typeof value === 'undefined') return true;

    // Simple usage: just model name
    if (typeof modelNameOrOption === 'string') {
      const where: Record<string, unknown> = { [property]: value };

      // On updates, exclude the current document by ID
      if (req.method === 'PUT' && req.params?.id) {
        where._id = { $ne: req.params.id };
      }

      const document: unknown =
        await this.connection.models[modelNameOrOption].findOne(where);
      return document === null;
    }

    // Advanced usage: with options
    const { modelName, options } = modelNameOrOption;
    const parsedOptions =
      typeof options === 'function' ? options(args) : options;
    const { where, ...findOptions } = parsedOptions || {};
    const whereCond: Record<string, unknown> = where || { [property]: value };

    // On updates, exclude the current document by ID
    if (req.method === 'PUT' && req.params?.id) {
      whereCond._id = { $ne: req.params.id };
    }

    const document: unknown = await this.connection.models[modelName].findOne(
      whereCond,
      null,
      findOptions,
    );
    return document === null;
  }

  /**
   * Returns the default validation error message when uniqueness validation fails.
   * Safely extracts model name and property from validation arguments.
   */
  public defaultMessage(validationArguments?: ValidationArguments): string {
    if (!validationArguments) {
      return 'Value must be unique';
    }

    const { property, constraints } =
      validationArguments as UniqueValidationArguments<M>;
    const [modelNameOrOption] = constraints || [];

    const modelName =
      typeof modelNameOrOption === 'string'
        ? modelNameOrOption
        : modelNameOrOption?.modelName || 'Resource';

    return `${modelName} with same ${property} already exists`;
  }
}

/**
 * Configuration options for advanced unique validation scenarios.
 * Allows custom query conditions and Mongoose query options.
 */
export interface UniqueValidatorOptions<M> {
  /** The name of the MongoDB model to validate against */
  modelName: string;
  /** Optional query options, can be static or dynamically generated */
  options?:
    | ((args: ValidationArguments) => MongoJobOptions<M>)
    | MongoJobOptions<M>;
}

/**
 * Decorator to set a field unique in the database
 *
 * @param {string} modelName Name of the model
 * @param {ValidationOptions} [validationOptions] Other validation options
 *
 * Eg: Set `name` field unique in `Page` module
 *```js
 * @IsUnique('Page')
 * name: string;
 * ```
 */
export function IsUnique(
  modelName: string,
  validationOptions?: ValidationOptions,
): any;

/**
 * Decorator to set a field unique in the database
 *
 * @param {UniqueValidatorOptions} options Unique validator options
 * @param {ValidationOptions} [validationOptions] Other validation options
 *
 * Eg: Set `name` field unique in `Page` module (include deleted records also)
 *```js
 * @IsUnique({
 *  modelName: 'Page',
 *  options: {
 *    paranoid: false
 *  }
 * })
 * name: string;
 * ```
 * Eg: Set `name` field unique in `Page` module based on custom where conditions
 *```js
 * @IsUnique({
 *  modelName: 'Page',
 *  options(args: ValidationArguments) {
      return {
        where: {
          name: {
            $eq: args.value,
          },
        },
        paranoid: false,
      };
    },
 * })
 * name: string;
 * ```
 */
export function IsUnique<M extends MongoSchema = any>(
  options: UniqueValidatorOptions<M>,
  validationOptions?: ValidationOptions,
): any;

/**
 * Decorator function overloads for @IsUnique validation.
 * Supports both simple model name usage and advanced options.
 */
export function IsUnique(
  modelName: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator;

export function IsUnique<M extends MongoSchema = any>(
  options: UniqueValidatorOptions<M>,
  validationOptions?: ValidationOptions,
): PropertyDecorator;

export function IsUnique<M extends MongoSchema = any>(
  modelNameOrOption: string | UniqueValidatorOptions<M>,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (target: object, propertyName: string | symbol) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [modelNameOrOption],
      validator: UniqueValidator<M>,
    });
  };
}
