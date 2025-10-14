import { Seed } from '@lib/mongo/modules/seeder';
import { User } from '@shared/modules/user/entities/user.entity';
import { Role } from '@shared/modules/user/role.enum';

const seed: Seed<User> = {
  model: 'User',
  action: 'once',
  data: [
    {
      role: Role.Admin,
      first_name: 'Super',
      last_name: 'Admin',
      email: 'admin@admin.com',
      phone_code: '+1',
      phone: '9999999999',
      password: '123456',
    },
    {
      role: Role.User,
      first_name: 'Test',
      last_name: 'User',
      email: 'user@user.com',
      phone_code: '+1',
      phone: '9999999998',
      password: '123456',
    },
  ],
};

export default seed;
