import { MongoModule } from '@lib/mongo/mongo.module';
import { Module } from '@nestjs/common';
import { CityService } from './city.service';
import { City, CitySchema } from './entities/city.entity';

@Module({
  imports: [
    MongoModule.forFeature(
      { name: City.name, schema: CitySchema },
      { cache: true },
    ),
  ],
  providers: [CityService],
  exports: [CityService],
})
export class CityModule {}
