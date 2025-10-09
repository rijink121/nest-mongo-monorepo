import { env } from '@core/utils/env';
import { validateEnvConfig } from '@core/utils/validate';
import { registerAs } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { IsEnum, IsString, Matches } from 'class-validator';

/**
 * MongoDB environment configuration validation class.
 *
 * This class defines the structure and validation rules for MongoDB-related
 * environment variables. It uses class-validator decorators to ensure that
 * the configuration is valid before the application starts.
 *
 * @example Environment variables
 * ```bash
 * # Standard MongoDB connection
 * MONGO_URI=mongodb://localhost:27017/myapp
 *
 * # MongoDB Atlas (SRV connection)
 * MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/myapp
 *
 * # Enable query logging
 * MONGO_LOGGING=Y
 * ```
 */
class MongoEnv {
  /**
   * MongoDB connection URI.
   *
   * Must be a valid MongoDB connection string starting with either:
   * - `mongodb://` for standard connections
   * - `mongodb+srv://` for MongoDB Atlas SRV connections
   *
   * @example Valid URIs
   * ```
   * mongodb://localhost:27017/mydb
   * mongodb://user:pass@host1:27017,host2:27017/mydb?replicaSet=rs0
   * mongodb+srv://user:pass@cluster.mongodb.net/mydb
   * ```
   */
  @IsString()
  @Matches(/^mongodb(\+srv)?:\/\//, {
    message: 'MONGO_URI must start with mongodb:// or mongodb+srv://',
  })
  MONGO_URI: string;

  /**
   * MongoDB query logging flag.
   *
   * Controls whether MongoDB queries should be logged to the console.
   * Useful for debugging but should be disabled in production.
   *
   * @default 'N'
   */
  @IsString()
  @IsEnum(['Y', 'N'], {
    message: 'MONGO_LOGGING must be either Y (enabled) or N (disabled)',
  })
  MONGO_LOGGING: 'Y' | 'N';
}

/**
 * MongoDB configuration provider for NestJS ConfigModule.
 *
 * This configuration provider:
 * - Initializes environment variables from local .env or AWS Secrets Manager
 * - Validates MongoDB connection settings against the MongoEnv schema
 * - Returns a properly configured MongooseModuleOptions object
 * - Provides sensible defaults for development environment
 *
 * The configuration supports both standard MongoDB connections and MongoDB Atlas
 * SRV connections with proper validation to ensure connection strings are valid.
 *
 * @returns Promise resolving to MongooseModuleOptions for @nestjs/mongoose
 *
 * @example Usage in module
 * ```typescript
 * @Module({
 *   imports: [
 *     MongooseModule.forRootAsync({
 *       imports: [ConfigModule],
 *       useFactory: (config: ConfigService) => config.get('mongo'),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example Environment setup
 * ```bash
 * # Required: MongoDB connection URI
 * MONGO_URI=mongodb://localhost:27017/myapp
 *
 * # Optional: Enable query logging (default: N)
 * MONGO_LOGGING=Y
 * ```
 */
export default registerAs<MongooseModuleOptions>(
  'mongo',
  (): MongooseModuleOptions => {
    // Validate MongoDB environment variables against the schema
    const validatedEnv = validateEnvConfig(MongoEnv, {
      MONGO_URI: env.get('MONGO_URI', 'mongodb://localhost/nest'),
      MONGO_LOGGING: env.get('MONGO_LOGGING', 'N'),
    });

    // Return validated MongoDB configuration for Mongoose
    return {
      // Use the validated and formatted MongoDB connection URI
      uri: validatedEnv.MONGO_URI,

      // Additional Mongoose connection options can be added here
      // Examples:
      // maxPoolSize: 10,
      // serverSelectionTimeoutMS: 5000,
      // socketTimeoutMS: 45000,
    };
  },
);
