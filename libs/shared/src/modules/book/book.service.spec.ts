import { SqlService } from '@lib/sql';
import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';

describe('BookService', () => {
  let service: BookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: SqlService,
          useValue: {
            createRecord: jest.fn(),
            updateRecord: jest.fn(),
            getAllRecords: jest.fn(),
            countAllRecords: jest.fn(),
            findRecordById: jest.fn(),
            findOneRecord: jest.fn(),
            deleteRecord: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
