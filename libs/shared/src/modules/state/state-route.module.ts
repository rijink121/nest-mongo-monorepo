import { Module } from '@nestjs/common';
import { StateController } from './state.controller';
import { StateModule } from './state.module';

@Module({
  imports: [StateModule],
  controllers: [StateController],
})
export class StateRouteModule {}
