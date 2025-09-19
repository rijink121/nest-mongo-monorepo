import { Type } from '@nestjs/common';

import { VirtualTypeOptions } from 'mongoose';
import { MongoSchema } from '../utils/schema';

// Metadata key for storing populate options
const POPULATE_KEY = 'POPULATE_KEY';

/**
 * Interface for storing populate option metadata.
 */
export interface PopulateWithOption {
  name: string;
  options: VirtualTypeOptions;
}

/**
 * Sets populate metadata for a property on a target class.
 */
export function setPopulate(
  options: VirtualTypeOptions,
  target: object,
  propertyKey: string,
) {
  Reflect.defineMetadata(POPULATE_KEY, options, target, propertyKey);
  const populates: string[] =
    (Reflect.getMetadata(POPULATE_KEY, target) as string[]) || [];
  populates.push(propertyKey);
  Reflect.defineMetadata(POPULATE_KEY, populates, target);
}

/**
 * Decorator to mark a property for population with the given options.
 */
export function Populate(options: VirtualTypeOptions) {
  return function (target: object, propertyKey: string) {
    setPopulate(options, target, propertyKey);
  };
}

/**
 * Decorator for a belongs-to (one-to-one) relationship.
 */
export function MongoBelongsTo(
  ref: string,
  localField: string,
  options?: VirtualTypeOptions['options'],
) {
  return function (target: object, propertyKey: string) {
    const _options: VirtualTypeOptions = {
      ref,
      localField,
      foreignField: '_id',
      justOne: true,
      options,
    };
    setPopulate(_options, target, propertyKey);
  };
}

/**
 * Decorator for a has-one (one-to-one) relationship.
 */
export function MongoHasOne(
  ref: string,
  foreignField: string,
  options?: VirtualTypeOptions['options'],
) {
  return function (target: object, propertyKey: string) {
    const _options: VirtualTypeOptions = {
      ref,
      localField: '_id',
      foreignField,
      justOne: true,
      options,
    };
    setPopulate(_options, target, propertyKey);
  };
}

/**
 * Decorator for a belongs-to-many (many-to-many) relationship.
 */
export function MongoBelongsToMany(
  ref: string,
  localField: string,
  options?: VirtualTypeOptions['options'],
) {
  return function (target: object, propertyKey: string) {
    const _options: VirtualTypeOptions = {
      ref,
      localField,
      foreignField: '_id',
      options,
    };
    setPopulate(_options, target, propertyKey);
  };
}

/**
 * Decorator for a has-many (one-to-many) relationship.
 */
export function MongoHasMany(
  ref: string,
  foreignField: string,
  options?: VirtualTypeOptions['options'],
) {
  return function (target: object, propertyKey: string) {
    const _options: VirtualTypeOptions = {
      ref,
      localField: '_id',
      foreignField,
      options,
    };
    setPopulate(_options, target, propertyKey);
  };
}

/**
 * Retrieves all populate metadata for a given model.
 */
export function getPopulates<T extends MongoSchema>(
  model: Type<T>,
): PopulateWithOption[] {
  const populates: string[] =
    (Reflect.getMetadata(POPULATE_KEY, new model()) as string[]) || [];
  return populates.map((prop) => ({
    name: prop,
    options: Reflect.getMetadata(
      POPULATE_KEY,
      new model(),
      prop,
    ) as VirtualTypeOptions,
  }));
}
