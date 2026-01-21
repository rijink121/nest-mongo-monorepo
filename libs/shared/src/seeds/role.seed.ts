import { Seed } from '@lib/sql/modules/seeder';
import { Role } from '@shared/modules/role/entities/role.entity';

const seed: Seed<Role> = {
  model: 'Role',
  action: 'once',
  data: [
    {
      name: 'Super Admin',
    },
    {
      name: 'Admin',
    },
    {
      name: 'Manager',
    },
    {
      name: 'Finance',
    },
    {
      name: 'Help Desk',
    },
    {
      name: 'Company Admin',
    },
    {
      name: 'Company User',
    },
    {
      name: 'Transporter Admin',
    },
    {
      name: 'Transporter User',
    },
    {
      name: 'Driver',
    },
  ],
};

export default seed;
