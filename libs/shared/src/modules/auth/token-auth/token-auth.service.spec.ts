import { Test, TestingModule } from '@nestjs/testing';
import { TokenAuthService } from './token-auth.service';

describe('TokenAuthService', () => {
  let service: TokenAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenAuthService],
    }).compile();

    service = module.get<TokenAuthService>(TokenAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
