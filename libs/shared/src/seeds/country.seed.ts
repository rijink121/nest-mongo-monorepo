import { Seed } from '@lib/mongo/modules/seeder';
import { Country } from '@shared/modules/country/entities/country.entity';

const seed: Seed<Country> = {
  model: 'Country',
  action: 'once',
  data: [
    {
      name: 'United States',
      code: 'US',
    },
    {
      name: 'Canada',
      code: 'CA',
    },
    {
      name: 'United Kingdom',
      code: 'GB',
    },
    {
      name: 'Australia',
      code: 'AU',
    },
    {
      name: 'India',
      code: 'IN',
    },
    {
      name: 'Germany',
      code: 'DE',
    },
    {
      name: 'France',
      code: 'FR',
    },
    {
      name: 'Japan',
      code: 'JP',
    },
    {
      name: 'China',
      code: 'CN',
    },
    {
      name: 'Brazil',
      code: 'BR',
    },
  ],
};

export default seed;
