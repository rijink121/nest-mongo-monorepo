import { Seed, SeedReference } from '@lib/sql/modules/seeder';
import type { State } from '@shared/modules/state/entities/state.entity';

const seed: Seed<Omit<State, 'country_id'> & { country_id: SeedReference }> = {
  model: 'State',
  action: 'once',
  data: [
    // United States States
    {
      name: 'California',
      code: 'CA',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'US' },
      }),
    },
    {
      name: 'Texas',
      code: 'TX',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'US' },
      }),
    },
    {
      name: 'Florida',
      code: 'FL',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'US' },
      }),
    },
    {
      name: 'New York',
      code: 'NY',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'US' },
      }),
    },
    {
      name: 'Illinois',
      code: 'IL',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'US' },
      }),
    },
    {
      name: 'Pennsylvania',
      code: 'PA',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'US' },
      }),
    },
    {
      name: 'Ohio',
      code: 'OH',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'US' },
      }),
    },
    {
      name: 'Georgia',
      code: 'GA',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'US' },
      }),
    },
    {
      name: 'North Carolina',
      code: 'NC',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'US' },
      }),
    },
    {
      name: 'Michigan',
      code: 'MI',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'US' },
      }),
    },

    // Canada Provinces
    {
      name: 'Ontario',
      code: 'ON',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'CA' },
      }),
    },
    {
      name: 'Quebec',
      code: 'QC',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'CA' },
      }),
    },
    {
      name: 'British Columbia',
      code: 'BC',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'CA' },
      }),
    },
    {
      name: 'Alberta',
      code: 'AB',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'CA' },
      }),
    },
    {
      name: 'Manitoba',
      code: 'MB',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'CA' },
      }),
    },

    // Australia States
    {
      name: 'New South Wales',
      code: 'NSW',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'AU' },
      }),
    },
    {
      name: 'Victoria',
      code: 'VIC',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'AU' },
      }),
    },
    {
      name: 'Queensland',
      code: 'QLD',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'AU' },
      }),
    },
    {
      name: 'Western Australia',
      code: 'WA',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'AU' },
      }),
    },
    {
      name: 'South Australia',
      code: 'SA',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'AU' },
      }),
    },

    // India States
    {
      name: 'Maharashtra',
      code: 'MH',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'IN' },
      }),
    },
    {
      name: 'Karnataka',
      code: 'KA',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'IN' },
      }),
    },
    {
      name: 'Tamil Nadu',
      code: 'TN',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'IN' },
      }),
    },
    {
      name: 'Delhi',
      code: 'DL',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'IN' },
      }),
    },
    {
      name: 'Gujarat',
      code: 'GJ',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'IN' },
      }),
    },

    // United Kingdom Countries
    {
      name: 'England',
      code: 'ENG',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'GB' },
      }),
    },
    {
      name: 'Scotland',
      code: 'SCT',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'GB' },
      }),
    },
    {
      name: 'Wales',
      code: 'WLS',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'GB' },
      }),
    },
    {
      name: 'Northern Ireland',
      code: 'NIR',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'GB' },
      }),
    },

    // Germany States
    {
      name: 'Bavaria',
      code: 'BY',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'DE' },
      }),
    },
    {
      name: 'Berlin',
      code: 'BE',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'DE' },
      }),
    },
    {
      name: 'Hamburg',
      code: 'HH',
      country_id: new SeedReference({
        model: 'Country',
        where: { code: 'DE' },
      }),
    },
  ],
};

export default seed;
