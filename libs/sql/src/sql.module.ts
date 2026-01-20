import { CachingModule } from '@core/modules/caching/caching.module';
import { DatabaseModule as MongoDatabaseModule } from '@lib/mongo/modules/database/database.module';
import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import type { ModelCtor } from 'sequelize-typescript';
import { DatabaseModule } from './modules/database/database.module';
import { SeederModule } from './modules/seeder';
import { SqlService } from './sql.service';

/**
 * Root-level configuration options for SqlModule.
 */
export interface SqlModuleOption {
  /** Enable database seeder module. */
  seeder?: boolean;
}

/**
 * Per-model configuration options to control additional behaviors.
 */
export interface SqlModelOption {
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
export class SqlModule {
  /**
   * Configure the root SqlModule with global options.
   *
   * This method initializes the SQL module with database connection
   * and optionally enables the seeder module for database initialization.
   *
   * @param options - Root module configuration options
   * @returns Configured dynamic module
   */
  static forRoot(options?: SqlModuleOption): DynamicModule {
    const imports: ModuleMetadata['imports'] = [];
    imports.push(DatabaseModule);

    if (options?.seeder) {
      imports.push(SeederModule);
    }

    return {
      module: SqlModule,
      imports,
    };
  }

  /**
   * Register a Sequelize model for use in a feature module.
   *
   * This method sets up a model with SqlService, providing CRUD operations,
   * history tracking, caching, and other advanced features based on the options.
   *
   * @param model - Sequelize model class
   * @param options - Per-model configuration options
   * @returns Configured dynamic module with SqlService
   */
  static forFeature(model: ModelCtor, options?: SqlModelOption): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        SequelizeModule.forFeature([model]),
        MongoDatabaseModule,
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
        SqlService,
      ],
      exports: [SqlService],
    };
  }
}
