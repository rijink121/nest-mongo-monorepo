import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import msConfig from '@shared/config/ms.config';

/**
 * Module for configuring and providing a microservice client.
 *
 * This module registers a microservice client named 'WORKER_SERVICE' using NestJS ClientsModule,
 * with configuration loaded from the shared ms.config. The client is available for injection
 * throughout the application, enabling communication with external microservices.
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [MsClientModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'WORKER_SERVICE', // Unique token for DI
        imports: [
          ConfigModule.forRoot({
            load: [msConfig], // Load microservice config from shared config
          }),
        ],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => config.getOrThrow('ms'),
      },
    ]),
  ],
})
export class MsClientModule {}
