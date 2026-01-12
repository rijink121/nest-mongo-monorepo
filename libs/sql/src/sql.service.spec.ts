import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { SqlService } from './sql.service';

describe('SqlService', () => {
  let service: SqlService<any>;

  beforeEach(async () => {
    const mockSequelize = {
      model: jest.fn().mockReturnValue({
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
      }),
      models: {},
    };

    const mockCachingService = {
      clearTag: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(10),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqlService,
        {
          provide: 'MODEL_NAME',
          useValue: 'TestModel',
        },
        {
          provide: 'MODEL_OPTIONS',
          useValue: {},
        },
        {
          provide: getConnectionToken(),
          useValue: mockSequelize,
        },
        {
          provide: 'CachingService',
          useValue: mockCachingService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SqlService<any>>(SqlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
