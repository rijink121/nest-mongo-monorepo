import { SqlModule } from '@lib/sql';
import { Module } from '@nestjs/common';
import { Role } from './entities/role.entity';
import { RoleService } from './role.service';

@Module({
  imports: [SqlModule.forFeature(Role)],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
