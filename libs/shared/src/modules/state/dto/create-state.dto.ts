import { OmitType } from '@nestjs/swagger';
import { State } from '../entities/state.entity';

export class CreateStateDto extends OmitType(State, ['country'] as const) {}
