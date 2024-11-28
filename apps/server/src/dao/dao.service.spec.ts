import { Test, TestingModule } from '@nestjs/testing';
import { DaoService } from './dao.service';

describe('DaoService', () => {
  let service: DaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DaoService],
    }).compile();

    service = module.get<DaoService>(DaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
