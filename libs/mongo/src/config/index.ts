import { env } from '@core/utils/env';
import { registerAs } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

/**
 * Mongo configuration provider for Nest's ConfigModule.
 *
 * Resolves the MongoDB connection URI from the environment or AWS Secrets Manager
 * via the shared `env` utility. Defaults to a local URI for development.
 */
export default registerAs<MongooseModuleOptions>(
  'mongo',
  async (): Promise<MongooseModuleOptions> => {
    // Ensure configuration and secrets are initialized before accessing values
    await env.initialize();

    return {
      uri: env.get<string>('MONGO_URI', 'mongodb://localhost/nest'),
    };
  },
);
