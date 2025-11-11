import { MongoModule } from '@lib/mongo/mongo.module';
import { Module } from '@nestjs/common';
import { CountryService } from './country.service';
import { Country, CountrySchema } from './entities/country.entity';

@Module({
  imports: [
    MongoModule.forFeature(
      { name: Country.name, schema: CountrySchema },
      { cache: true, cacheTags: ['country', 'state'] },
    ),
  ],
  providers: [CountryService],
  exports: [CountryService],
})
export class CountryModule {}
