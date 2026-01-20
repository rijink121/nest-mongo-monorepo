import { Seed } from '@lib/sql/modules/seeder';
import { Role } from '@shared/definitions/role.enum';
import { User } from '@shared/modules/user/entities/user.entity';

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
