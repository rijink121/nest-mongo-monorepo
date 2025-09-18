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
 * Root-level options for MongoModule.
 */
export interface MongoModuleOption {
  /** Enable database seeder module when true. */
  seeder?: boolean;
}

/**
 * Per-model options to control additional behaviors.
 */
export interface MongoModelOption {
  /** Enable history tracking for the model. */
  history?: boolean;
  /** TTL in days for history records, when history is enabled. */
  historyExpireIn?: number;
  /** TTL in days for soft-deleted records. */
  trashExpireIn?: number;
}

@Module({})
export class MongoModule {
  /**
   * Configure and return the root module, optionally enabling the seeder.
   */
  static root(options?: MongoModuleOption): DynamicModule {
    const imports: ModuleMetadata['imports'] = [];
    imports.push(DatabaseModule);

    // Optionally include the seeder module
    if (options?.seeder) {
      imports.push(SeederModule);
    }
    return {
      module: MongoModule,
      imports,
    };
  }

  /**
   * Register a model with optional per-model options and an optional connection name.
   */
  static register(
    model: ModelDefinition,
    options?: MongoModelOption,
    connectionName?: string,
  ): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [MongooseModule.forFeature([model], connectionName)],
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
   * Register a model asynchronously using a factory, with optional options and connection name.
   */
  static registerAsync(
    modelFactory: AsyncModelFactory,
    options?: MongoModelOption,
    connectionName?: string,
  ): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [MongooseModule.forFeatureAsync([modelFactory], connectionName)],
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
