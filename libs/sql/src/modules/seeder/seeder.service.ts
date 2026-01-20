import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import seeds from '@shared/seeds';
import { Sequelize } from 'sequelize-typescript';
import { Seed, SeedItem, SeedReference } from './seeder.definition';

/**
 * Service responsible for seeding MongoDB collections with initial data.
 *
 * This service handles various seeding strategies including:
 * - One-time seeding (only if collection is empty)
 * - Always seeding with truncate/delete strategies
 * - Always seeding with create/update strategies
 * - Cross-reference resolution between collections
 *
 * @example
 * ```typescript
 * // In your application bootstrap
 * const seederService = app.get(SeederService);
 * await seederService.seed();
 * ```
 */
@Injectable()
export class SeederService {
  private logger: Logger = new Logger('MongoSeeder');

  constructor(@InjectConnection() private connection: Sequelize) {}

  /**
   * Checks if a seed should be skipped based on existing data.
   *
   * This method is used for 'once' action seeds to determine if the collection
   * already contains documents. If documents exist, the seed is skipped.
   *
   * @param seed - The seed configuration to check
   * @returns True if the seed should be skipped, false otherwise
   *
   * @private
   */
  private async shouldSkipSeed(seed: Seed<any>): Promise<boolean> {
    try {
      // Check if collection has any documents
      const count = await this.connection.models[seed.model].count();
      if (count > 0) {
        this.logger.log(`Ignoring - ${seed.model} already exist`);
        return true;
      }
    } catch (error) {
      this.logger.error(
        `Failed - count ${seed.model} ${error instanceof Error ? error.message : error}`,
      );
      return true;
    }
    return false;
  }

  /**
   * Cleans existing data from a collection based on the seed's always rule.
   *
   * Supports two cleaning strategies:
   * - 'truncate': Drops the entire collection (removes indexes too)
   * - 'delete': Deletes all documents but keeps the collection structure
   *
   * @param seed - The seed configuration with cleaning rules
   * @returns True if cleaning was successful, false otherwise
   *
   * @private
   */
  private async cleanExistingData(seed: Seed<any>): Promise<boolean> {
    try {
      if (seed.action !== 'always') return false;

      if (seed.alwaysRule === 'truncate') {
        // Drop the entire collection including indexes
        await this.connection.models[seed.model].truncate();
      } else {
        // Delete all documents but keep collection structure
        await this.connection.models[seed.model].destroy({ where: {} });
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Failed - empty ${seed.model} ${error instanceof Error ? error.message : error}`,
      );
      return false;
    }
  }

  /**
   * Resolves cross-references between seed items.
   *
   * When a seed item contains a SeedReference instance, this method queries
   * the referenced collection to find the parent document and replaces the
   * reference with the parent document's ID.
   *
   * @param item - The seed item that may contain references
   * @returns A new seed item with resolved references
   *
   * @example
   * ```typescript
   * // If seed item has a reference like:
   * // { userId: new SeedReference({ model: 'User', where: { email: 'admin@example.com' } }) }
   * // It will be resolved to:
   * // { userId: '507f1f77bcf86cd799439011' }
   * ```
   *
   * @private
   */
  private async resolveReferences(item: SeedItem<unknown>) {
    const body: SeedItem<unknown> = { ...item };

    for (const key in item) {
      if (Object.prototype.hasOwnProperty.call(item, key)) {
        const value = item[key];

        // Check if the value is a reference to another document
        if (value instanceof SeedReference) {
          try {
            // Find the parent document in the referenced collection
            const parent = await this.connection.models[value.model].findOne({
              where: value.where,
            });

            // Replace reference with parent document ID or null if not found
            if (parent) body[key] = parent.get('id') as number;
            else body[key] = null;
          } catch (error) {
            this.logger.warn(
              `Reference - error  ${error instanceof Error ? error.message : error}`,
            );
            body[key] = null;
          }
        }
      }
    }

    return body;
  }

  /**
   * Seeds data into a collection based on the seed configuration.
   *
   * Handles different seeding strategies:
   * - For 'always' action with 'create' rule: Creates only if record doesn't exist
   * - For 'always' action with 'update' rule: Updates if exists, creates if not
   * - For other actions: Always creates new records
   *
   * @param seed - The seed configuration containing model and data
   *
   * @private
   */
  private async seedData(seed: Seed<any>) {
    this.logger.log(`Seeding ${seed.model}`);

    // Process each seed item
    for (let index = 0; index < seed.data.length; index++) {
      // Resolve any cross-references in the seed item
      const body = await this.resolveReferences(seed.data[index]);

      // Handle create/update strategy
      if (
        seed.action === 'always' &&
        (seed.alwaysRule === 'create' || seed.alwaysRule === 'update')
      ) {
        try {
          // Check if record already exists
          const record = await this.connection.models[seed.model].findOne({
            where: seed.alwaysWhere(body),
          });

          if (!record) {
            // Create new record if it doesn't exist
            await this.connection.models[seed.model].create(body as any);
          } else if (seed.alwaysRule === 'update') {
            // Update existing record if update rule is specified
            record.set(body);
            await record.save();
          }
        } catch (error) {
          this.logger.error(
            `Failed - seed ${seed.model} ${error instanceof Error ? error.message : error}`,
          );
          this.logger.debug(body);
        }
      } else {
        // Simple create strategy for other cases
        try {
          await this.connection.models[seed.model].create(body as any);
        } catch (error) {
          this.logger.error(
            `Failed - seed ${seed.model} ${error instanceof Error ? error.message : error}`,
          );
          this.logger.debug(body);
        }
      }
    }

    this.logger.log(`Seeded ${seed.model}`);
  }

  /**
   * Main method to execute all seed operations.
   *
   * Processes all seeds defined in the seeds configuration file, handling:
   * - Model availability checks
   * - Action-based seeding strategies ('never', 'once', 'always')
   * - Data cleaning for 'always' actions with 'delete'/'truncate' rules
   * - Conditional seeding for 'always' actions with 'create'/'update' rules
   *
   * Seeding Actions:
   * - 'never': Skips the seed entirely
   * - 'once': Seeds only if collection is empty
   * - 'always' with 'truncate'/'delete': Cleans then seeds
   * - 'always' with 'create'/'update': Conditionally creates or updates
   *
   * @returns Promise that resolves when all seeds are processed
   *
   * @example
   * ```typescript
   * await seederService.seed();
   * ```
   */
  async seed() {
    this.logger.log('Started');

    // Process each seed configuration
    for (let index = 0; index < seeds.length; index++) {
      const seed = seeds[index];
      this.logger.log(`Model: ${seed.model}`);

      // Validate model exists in Mongoose connection
      if (typeof this.connection.models[seed.model] === 'undefined') {
        this.logger.log(`Ignoring - ${seed.model} model not available`);
        continue;
      }

      // Skip if seed action is 'never'
      if (seed.action === 'never') {
        this.logger.log(`Ignoring - ${seed.model} not required`);
        continue;
      }

      // Handle 'once' action and 'always' with delete/truncate rules
      else if (
        seed.action === 'once' ||
        (seed.action === 'always' &&
          (seed.alwaysRule === 'delete' || seed.alwaysRule === 'truncate'))
      ) {
        // For 'once' action, skip if data already exists
        if (seed.action === 'once' && (await this.shouldSkipSeed(seed))) {
          continue;
        }

        // For 'always' action, clean existing data first
        if (seed.action === 'always') {
          const cleaned = await this.cleanExistingData(seed);
          if (!cleaned) {
            continue;
          }
        }

        await this.seedData(seed);
      }

      // Handle 'always' action with create/update rules
      else if (
        seed.action === 'always' &&
        (seed.alwaysRule === 'create' || seed.alwaysRule === 'update')
      ) {
        // Validate that where condition is provided
        if (!seed.alwaysWhere) {
          this.logger.error(
            `Failed - where condition missing for ${seed.model}`,
          );
          continue;
        }
        await this.seedData(seed as Seed<any>);
      }

      // Invalid seed configuration
      else {
        this.logger.error(`Failed - Rule missing for ${seed.model}`);
        continue;
      }
    }

    this.logger.log('Completed');
  }

  /**
   * Synchronous wrapper for seed operation with error handling.
   *
   * This method executes the seed operation asynchronously but returns immediately,
   * allowing it to be called without awaiting. Errors are caught and logged
   * automatically.
   *
   * **Note:** This method should be used when you want fire-and-forget seeding
   * behavior. For controlled seeding with error handling, use the `seed()` method
   * directly with proper await and try-catch.
   *
   * @example
   * ```typescript
   * // Fire-and-forget seeding (doesn't block execution)
   * seederService.seedSync();
   *
   * // Controlled seeding (recommended)
   * try {
   *   await seederService.seed();
   * } catch (error) {
   *   // Handle error
   * }
   * ```
   */
  seedSync() {
    // Execute seed operation without blocking, catch and log any errors
    this.seed().catch((error) => {
      this.logger.error(
        `Seeding failed: ${error instanceof Error ? error.message : error}`,
      );
    });
  }
}
