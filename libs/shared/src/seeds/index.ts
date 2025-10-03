import { Seed } from '@lib/mongo/modules/seeder';
import userSeed from './user.seed';

const seeds: Seed<unknown>[] = [userSeed];

export default seeds;
