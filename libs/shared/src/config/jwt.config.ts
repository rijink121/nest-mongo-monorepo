import { env } from '@core/utils/env';
import { validateEnvConfig } from '@core/utils/validate';
import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { IsString, Matches, MinLength } from 'class-validator';

/**
 * JWT environment configuration validation class.
 *
 * This class defines the structure and validation rules for JWT-related
 * environment variables. It uses class-validator decorators to ensure that
 * the JWT configuration is secure and valid before the application starts.
 *
 * @example Environment variables
 * ```bash
 * # JWT secret key (minimum 8 characters for security)
 * JWT_SECRET=my_super_secret_key_123
 * ```
 */
class JwtEnv {
  /**
   * JWT secret key for token signing and verification.
   *
   * This secret is used to sign and verify JWT tokens. For security reasons,
   * it must be at least 8 characters long and contain at least one alphabet,
   * one number, and one special character. In production, use a strong,
   * randomly generated secret key.
   *
   * @security CRITICAL - Keep this secret secure and never expose it
   * @example Valid secrets
   * ```
   * JWT_SECRET=mySecretKey123!
   * JWT_SECRET=Secure@Pass2024
   * JWT_SECRET=MyApp$ecret9
   * ```
   */
  @IsString({
    message: 'JWT_SECRET must be a string',
  })
  @MinLength(8, {
    message: 'JWT_SECRET must be at least 8 characters long for security',
  })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'JWT_SECRET must contain at least one letter, one number, and one special character (@$!%*?&)',
  })
  JWT_SECRET: string;
}

/**
 * JWT configuration provider for NestJS ConfigModule.
 *
 * This configuration provider:
 * - Initializes environment variables from local .env or AWS Secrets Manager
 * - Validates JWT secret key against security requirements (minimum 8 characters, contains letter, number, and special character)
 * - Returns a properly configured JwtModuleOptions object
 * - Provides a fallback secret for development (should be overridden in production)
 *
 * The configuration ensures that JWT secrets meet minimum security standards
 * and provides clear validation errors if requirements are not met.
 *
 * @returns Promise resolving to JwtModuleOptions for @nestjs/jwt
 *
 * @example Usage in module
 * ```typescript
 * @Module({
 *   imports: [
 *     JwtModule.registerAsync({
 *       imports: [ConfigModule],
 *       useFactory: (config: ConfigService) => config.get('jwt'),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AuthModule {}
 * ```
 *
 * @example Environment setup
 * ```bash
 * # Required: JWT secret key (minimum 8 characters with letter, number, and special character)
 * JWT_SECRET=MySecureKey123!
 * ```
 */
export default registerAs<JwtModuleOptions>('jwt', (): JwtModuleOptions => {
  // Validate JWT environment variables against the schema
  const validatedEnv = validateEnvConfig(JwtEnv, {
    JWT_SECRET: env.get('JWT_SECRET', 'Secret123!', true),
  });

  // Return validated JWT configuration
  return {
    // Use the validated JWT secret key
    secret: validatedEnv.JWT_SECRET,

    // Configure token expiration (24 hours in seconds)
    signOptions: {
      expiresIn: 24 * 60 * 60, // 86400 seconds = 24 hours
    },
  };
});
