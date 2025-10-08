import { uuid } from '@core/utils';
import { MongoModule } from '@lib/mongo/mongo.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { hashSync } from 'bcrypt';
import { User, UserDocument, UserSchema } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongoModule.registerAsync({
      name: User.name,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const schema = UserSchema;
        schema.pre<UserDocument>('save', function (next) {
          if (this.isNew) {
            this.uid = uuid();
            if (this.password) {
              this.password = hashSync(`${this.password}`, 10);
            }
          }
          if (this.first_name && this.last_name) {
            this.name = `${this.first_name} ${this.last_name}`;
          }
          next();
        });
        schema.virtual<UserDocument>('avatar_url').get(function () {
          return this.avatar ? configService.get('cdnURL') + this.avatar : '';
        });
        return schema;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
