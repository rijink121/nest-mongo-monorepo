import { SqlModule } from '@lib/sql';
import { Module } from '@nestjs/common';
import { State } from './entities/state.entity';
import { StateService } from './state.service';

@Module({
  imports: [SqlModule.forFeature(State)],
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}
