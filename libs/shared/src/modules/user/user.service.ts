import { Job, JobResponse } from '@core/utils/job';
import { ModelService, SearchFields, SqlService } from '@lib/sql';
import { Injectable } from '@nestjs/common';
import { compareSync, hashSync } from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService extends ModelService<User> {
  /**
   * searchFields
   * @property array of fields to include in search
   */
  searchFields: SearchFields<User> = ['name'];

  constructor(db: SqlService<User>) {
    super(db);
  }

  async changePassword(
    job: Job<ChangePasswordDto & { user_password: string }>,
  ): Promise<JobResponse> {
    const { owner, payload } = job;
    if (!compareSync(payload!.old_password, payload!.user_password)) {
      return { error: 'Invalid old password' };
    }
    try {
      const password = hashSync(payload!.password, 10);
      const { error } = await this.$db.updateRecord({
        owner,
        id: +owner!.id,
        body: { password },
      });

      if (error) return { error };

      return { data: 'Success' };
    } catch (error) {
      return { error };
    }
  }
}
