import config from '@lib/sql/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule, SequelizeModuleOptions } from '@nestjs/sequelize';

/**
 * DatabaseModule
 *
 * Provides a configured Sequelize connection using values from ConfigModule.
 * Initializes the SQL database connection with options from the config.
 */
@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forRootAsync({
      imports: [
        ConfigModule.forRoot({
          load: [config],
        }),
      ],
      inject: [ConfigService],
      useFactory: (config: ConfigService): SequelizeModuleOptions => {
        return config.get<SequelizeModuleOptions>('sql')!;
      },
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
