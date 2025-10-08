import config from '@lib/mongo/config';
import { setLogger } from '@lib/mongo/utils/logger';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';

/**
 * DatabaseModule
 *
 * Provides a configured Mongoose connection using values from ConfigModule.
 * If `MONGO_LOGGING` is set to 'Y', enables verbose query logging to Nest Logger.
 */
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [
        ConfigModule.forRoot({
          load: [config],
        }),
      ],
      inject: [ConfigService],
      useFactory: (config: ConfigService): MongooseModuleOptions => {
        // Optionally enable Mongoose debug logging
        if (config.get<string>('MONGO_LOGGING') === 'Y') {
          setLogger();
        }

        return config.get<MongooseModuleOptions>('mongo')!;
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
