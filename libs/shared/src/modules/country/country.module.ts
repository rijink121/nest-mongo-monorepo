import { SqlModule } from '@lib/sql';
import { Module } from '@nestjs/common';
import { CountryService } from './country.service';
import { Country } from './entities/country.entity';

@Module({
  imports: [SqlModule.forFeature(Country)],
  providers: [CountryService],
  exports: [CountryService],
})
export class CountryModule {}
