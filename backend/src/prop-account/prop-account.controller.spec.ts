import { Test, TestingModule } from '@nestjs/testing';
import { PropAccountController } from './prop-account.controller';

describe('PropAccountController', () => {
  let controller: PropAccountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropAccountController],
    }).compile();

    controller = module.get<PropAccountController>(PropAccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
