import { env } from '@core/utils/env';
import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

/**
 * Redis configuration provider for Nest's ConfigModule.
 *
 * Resolves the Redis connection URI from the environment or AWS Secrets Manager
 * via the shared `env` utility. Defaults to a local URI for development.
 */
export default registerAs<JwtModuleOptions>(
  'jwt',
  async (): Promise<JwtModuleOptions> => {
    // Ensure configuration and secrets are initialized before accessing values
    await env.initialize();

    return {
      secret: env.get('JWT_SECRET_KEY', '$3cR7!@#'),
      signOptions: { expiresIn: 24 * 60 * 60 },
    };
  },
);
