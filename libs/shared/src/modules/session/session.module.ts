import { MongoModule } from '@lib/mongo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from '@shared/config/jwt.config';
import { Session, SessionSchema } from './entities/session.entity';
import { SessionService } from './session.service';

@Module({
  imports: [
    MongoModule.forFeature({ name: Session.name, schema: SessionSchema }),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [
        ConfigModule.forRoot({
          load: [jwtConfig],
        }),
      ],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.getOrThrow('jwt'),
    }),
  ],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
