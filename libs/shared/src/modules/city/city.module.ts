import { SqlModule } from '@lib/sql';
import { Module } from '@nestjs/common';
import { CityService } from './city.service';
import { City } from './entities/city.entity';

@Module({
  imports: [SqlModule.forFeature(City)],
  providers: [CityService],
  exports: [CityService],
})
export class CityModule {}
