import { Logger } from '@nestjs/common';
import { set } from 'mongoose';
import { inspect } from 'util';

/**
 * Shared NestJS logger instance for Mongo query logging.
 */
export const logger: Logger = new Logger('MongoQueryLog');

/**
 * Enables verbose Mongoose debug logging, formatting query arguments
 * for readability using Node's util.inspect.
 */
export const setLogger = (): void => {
  set(
    'debug',
    (
      collectionName: string,
      methodName: string,
      ...methodArgs: unknown[]
    ): void => {
      const args = methodArgs
        .map((m) =>
          inspect(m, false, 10, true)
            .replace(/\n/g, '')
            .replace(/\s{2,}/g, ' '),
        )
        .join(', ');

      logger.debug(`\x1B[0m${collectionName}.${methodName}(${args})`);
    },
  );
};
