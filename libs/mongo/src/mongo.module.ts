import { CachingModule } from '@core/modules/caching/caching.module';
import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import {
  AsyncModelFactory,
  ModelDefinition,
  MongooseModule,
} from '@nestjs/mongoose';
import { DatabaseModule } from './modules/database/database.module';
import { SeederModule } from './modules/seeder/seeder.module';
import { MongoService } from './mongo.service';
import { UniqueValidator } from './utils/unique-validator';

/**
 * Root-level configuration options for MongoModule.
 */
export interface MongoModuleOption {
  /** Enable database seeder module. */
  seeder?: boolean;
}

/**
 * Per-model configuration options to control additional behaviors.
 */
export interface MongoModelOption {
  /** Enable automatic history tracking for create, update, delete, and restore operations. */
  history?: boolean;
  /** Number of days before history records expire and are automatically deleted. */
  historyExpireIn?: number;
  /** Number of days before hard-deleted records in trash expire and are permanently removed. */
  trashExpireIn?: number;
  /** Enable automatic cache management with invalidation on data changes. */
  cache?: boolean;
  /** Cache tag identifiers for targeted cache invalidation (defaults to snake_case model name). */
  cacheTags?: string[];
}

@Module({})
export class MongoModule {
  /**
   * Configure the root MongoModule with global options.
   *
   * This method initializes the MongoDB module with database connection
   * and optionally enables the seeder module for database initialization.
   *
   * @param options - Root module configuration options
   * @returns Configured dynamic module
   */
  static forRoot(options?: MongoModuleOption): DynamicModule {
    const imports: ModuleMetadata['imports'] = [];
    imports.push(DatabaseModule);

    // Include the seeder module if enabled
    if (options?.seeder) {
      imports.push(SeederModule);
    }

    return {
      module: MongoModule,
      imports,
    };
  }

  /**
   * Register a Mongoose model for use in a feature module.
   *
   * This method sets up a model with MongoService, providing CRUD operations,
   * history tracking, caching, and other advanced features based on the options.
   *
   * @param model - Mongoose model definition (schema and name)
   * @param options - Per-model configuration options
   * @param connectionName - Optional custom connection name (uses default if not provided)
   * @returns Configured dynamic module with MongoService
   */
  static forFeature(
    model: ModelDefinition,
    options?: MongoModelOption,
    connectionName?: string,
  ): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forFeature([model], connectionName),
        CachingModule,
      ],
      providers: [
        {
          provide: 'MODEL_NAME',
          useValue: model.name,
        },
        {
          provide: 'MODEL_OPTIONS',
          useValue: options || {},
        },
        MongoService,
        UniqueValidator,
      ],
      exports: [MongoService],
    };
  }

  /**
   * Register a Mongoose model asynchronously using a factory for use in a feature module.
   *
   * This method is similar to forFeature but allows for async model definition,
   * useful when the schema depends on configuration or other async resources.
   *
   * @param modelFactory - Async factory for creating the model definition
   * @param options - Per-model configuration options
   * @param connectionName - Optional custom connection name (uses default if not provided)
   * @returns Configured dynamic module with MongoService
   */
  static forFeatureAsync(
    modelFactory: AsyncModelFactory,
    options?: MongoModelOption,
    connectionName?: string,
  ): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forFeatureAsync([modelFactory], connectionName),
        CachingModule,
      ],
      providers: [
        {
          provide: 'MODEL_NAME',
          useValue: modelFactory.name,
        },
        {
          provide: 'MODEL_OPTIONS',
          useValue: options || {},
        },
        MongoService,
        UniqueValidator,
      ],
      exports: [MongoService],
    };
  }
}
