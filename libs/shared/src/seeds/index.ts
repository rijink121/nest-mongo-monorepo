import { Seed } from '@lib/mongo/modules/seeder';
import citySeed from './city.seed';
import countrySeed from './country.seed';
import stateSeed from './state.seed';
import userSeed from './user.seed';

const seeds: Seed<unknown>[] = [userSeed, countrySeed, stateSeed, citySeed];

export default seeds;
