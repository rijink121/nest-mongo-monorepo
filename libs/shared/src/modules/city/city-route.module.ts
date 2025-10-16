import { Module } from '@nestjs/common';
import { CityController } from './city.controller';
import { CityModule } from './city.module';

@Module({
  imports: [CityModule],
  controllers: [CityController],
})
export class CityRouteModule {}
