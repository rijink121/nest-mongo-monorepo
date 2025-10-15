import { Test, TestingModule } from '@nestjs/testing';
import { TokenAuthController } from './token-auth.controller';

describe('TokenAuthController', () => {
  let controller: TokenAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenAuthController],
    }).compile();

    controller = module.get<TokenAuthController>(TokenAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
