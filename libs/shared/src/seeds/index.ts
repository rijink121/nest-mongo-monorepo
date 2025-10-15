import { Seed } from '@lib/mongo/modules/seeder';
import countrySeed from './country.seed';
import stateSeed from './state.seed';
import userSeed from './user.seed';

const seeds: Seed<unknown>[] = [userSeed, countrySeed, stateSeed];

export default seeds;
