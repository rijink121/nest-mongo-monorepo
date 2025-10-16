import { Seed, SeedReference } from '@lib/mongo/modules/seeder';
import { City } from '@shared/modules/city/entities/city.entity';

const seed: Seed<Omit<City, 'state_id'> & { state_id: SeedReference }> = {
  model: 'City',
  action: 'once',
  data: [
    // California Cities
    {
      name: 'Los Angeles',
      code: 'LA',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'CA' },
      }),
    },
    {
      name: 'San Francisco',
      code: 'SF',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'CA' },
      }),
    },
    {
      name: 'San Diego',
      code: 'SD',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'CA' },
      }),
    },

    // Texas Cities
    {
      name: 'Houston',
      code: 'HOU',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'TX' },
      }),
    },
    {
      name: 'Dallas',
      code: 'DAL',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'TX' },
      }),
    },
    {
      name: 'Austin',
      code: 'AUS',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'TX' },
      }),
    },

    // Florida Cities
    {
      name: 'Miami',
      code: 'MIA',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'FL' },
      }),
    },
    {
      name: 'Orlando',
      code: 'ORL',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'FL' },
      }),
    },
    {
      name: 'Tampa',
      code: 'TPA',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'FL' },
      }),
    },

    // New York Cities
    {
      name: 'New York City',
      code: 'NYC',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'NY' },
      }),
    },
    {
      name: 'Buffalo',
      code: 'BUF',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'NY' },
      }),
    },

    // Ontario Cities (Canada)
    {
      name: 'Toronto',
      code: 'TOR',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'ON' },
      }),
    },
    {
      name: 'Ottawa',
      code: 'OTT',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'ON' },
      }),
    },

    // New South Wales Cities (Australia)
    {
      name: 'Sydney',
      code: 'SYD',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'NSW' },
      }),
    },

    // Victoria Cities (Australia)
    {
      name: 'Melbourne',
      code: 'MEL',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'VIC' },
      }),
    },

    // Maharashtra Cities (India)
    {
      name: 'Mumbai',
      code: 'BOM',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'MH' },
      }),
    },
    {
      name: 'Pune',
      code: 'PNQ',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'MH' },
      }),
    },

    // Karnataka Cities (India)
    {
      name: 'Bangalore',
      code: 'BLR',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'KA' },
      }),
    },

    // England Cities (UK)
    {
      name: 'London',
      code: 'LON',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'ENG' },
      }),
    },
    {
      name: 'Manchester',
      code: 'MAN',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'ENG' },
      }),
    },

    // Bavaria Cities (Germany)
    {
      name: 'Munich',
      code: 'MUC',
      state_id: new SeedReference({
        model: 'State',
        where: { code: 'BY' },
      }),
    },
  ],
};

export default seed;
