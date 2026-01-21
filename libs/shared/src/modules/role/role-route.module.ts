import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleModule } from './role.module';

@Module({
  imports: [RoleModule],
  controllers: [RoleController],
})
export class RoleRouteModule {}
