import { Test, TestingModule } from '@nestjs/testing';
import { ActiveController } from './active.controller';
import { ActiveService } from './active.service';

describe('ActiveController', () => {
  let controller: ActiveController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActiveController],
      providers: [ActiveService],
    }).compile();

    controller = module.get<ActiveController>(ActiveController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
