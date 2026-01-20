import { SqlModule } from '@lib/sql';
import { Module } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Module({
  imports: [SqlModule.forFeature(User)],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
