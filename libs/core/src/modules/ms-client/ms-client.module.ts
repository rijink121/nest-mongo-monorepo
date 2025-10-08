import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import msConfig from '@shared/config/ms.config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'WORKER_SERVICE',
        imports: [
          ConfigModule.forRoot({
            load: [msConfig],
          }),
        ],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => config.getOrThrow('ms'),
      },
    ]),
  ],
})
export class MsClientModule {}
