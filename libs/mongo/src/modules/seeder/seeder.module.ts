import { isPrimaryInstance } from '@core/utils';
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { SeederService } from './seeder.service';

@Module({
  imports: [DatabaseModule],
  providers: [SeederService],
})
export class SeederModule implements OnModuleInit {
  constructor(
    private seederService: SeederService,
    private configService: ConfigService,
  ) {}
  async onModuleInit() {
    if (isPrimaryInstance()) {
      if (this.configService.get('SEEDER_AWAIT') === 'Y') {
        await this.seederService.seed();
      } else {
        this.seederService.seedSync();
      }
    }
  }
}
