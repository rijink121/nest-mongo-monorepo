import { isPrimaryInstance } from '@core/utils';
import { env } from '@core/utils/env';
import { validateEnvConfig } from '@core/utils/validate';
import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { sqlDialect } from '@shared/shared.config';
import { IsEnum, IsNumber, IsString } from 'class-validator';

const logger: Logger = new Logger('SqlQueryLog');

/**
 * SQL environment configuration validation class.
 *
 * This class defines the structure and validation rules for SQL-related
 * environment variables. It uses class-validator decorators to ensure that
 * the configuration is valid before the application starts.
 */
class SqlEnv {
  @IsString()
  DATABASE_HOST: string;

  @IsNumber()
  DATABASE_PORT: number;

  @IsString()
  DATABASE_USERNAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  @IsEnum(['Y', 'N'])
  DATABASE_ALTER_SYNC: 'Y' | 'N';

  @IsString()
  @IsEnum(['Y', 'N'])
  DATABASE_DISABLE_SSL: 'Y' | 'N';

  @IsString()
  @IsEnum(['Y', 'N'])
  DATABASE_LOGGING: 'Y' | 'N';
}

export default registerAs('sql', (): SequelizeModuleOptions => {
  // Validate SQL environment variables against the schema
  const validatedEnv = validateEnvConfig(SqlEnv, {
    DATABASE_HOST: env.get('DATABASE_HOST', 'localhost'),
    DATABASE_PORT: parseInt(env.get('DATABASE_PORT', '3306'), 10),
    DATABASE_USERNAME: env.get('DATABASE_USERNAME', 'root'),
    DATABASE_PASSWORD: env.get('DATABASE_PASSWORD', ''),
    DATABASE_NAME: env.get('DATABASE_NAME'),
    DATABASE_ALTER_SYNC: env.get('DATABASE_ALTER_SYNC', 'N'),
    DATABASE_DISABLE_SSL: env.get('DATABASE_DISABLE_SSL', 'N'),
    DATABASE_LOGGING: env.get('DATABASE_LOGGING', 'N'),
  });

  return {
    dialect: sqlDialect,
    host: validatedEnv.DATABASE_HOST,
    port: validatedEnv.DATABASE_PORT,
    username: validatedEnv.DATABASE_USERNAME,
    password: validatedEnv.DATABASE_PASSWORD,
    database: validatedEnv.DATABASE_NAME,
    autoLoadModels: true,
    synchronize: isPrimaryInstance() && true, // avoid multiple sync while using pm2 cluster
    sync: {
      alter: validatedEnv.DATABASE_ALTER_SYNC === 'Y',
    },
    dialectOptions: {
      ssl:
        validatedEnv.DATABASE_DISABLE_SSL === 'Y'
          ? false
          : {
              require: true,
              rejectUnauthorized: false,
            },
    },
    logging: (sql: string) =>
      validatedEnv.DATABASE_LOGGING === 'Y'
        ? logger.debug(`\x1B[0m${sql}`)
        : false,
  };
});
