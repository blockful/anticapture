import { Test, TestingModule } from '@nestjs/testing';
import { DaoController } from './dao.controller';
import { DaoService } from './dao.service';

describe('DaoController', () => {
  let controller: DaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DaoController],
      providers: [DaoService],
    }).compile();

    controller = module.get<DaoController>(DaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
