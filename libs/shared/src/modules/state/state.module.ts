import { MongoModule } from '@lib/mongo/mongo.module';
import { Module } from '@nestjs/common';
import { State, StateSchema } from './entities/state.entity';
import { StateService } from './state.service';

@Module({
  imports: [
    MongoModule.forFeature(
      { name: State.name, schema: StateSchema },
      { cache: true },
    ),
  ],
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}
