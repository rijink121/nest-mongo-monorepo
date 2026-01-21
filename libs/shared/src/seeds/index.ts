import { Seed } from '@lib/mongo/modules/seeder';
import citySeed from './city.seed';
import countrySeed from './country.seed';
import roleSeed from './role.seed';
import stateSeed from './state.seed';
import userSeed from './user.seed';

const seeds: Seed<unknown>[] = [
  roleSeed,
  userSeed,
  countrySeed,
  stateSeed,
  citySeed,
];

export default seeds;
