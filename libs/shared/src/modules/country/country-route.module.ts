import { Module } from '@nestjs/common';
import { CountryController } from './country.controller';
import { CountryModule } from './country.module';

@Module({
  imports: [CountryModule],
  controllers: [CountryController],
})
export class CountryRouteModule {}
