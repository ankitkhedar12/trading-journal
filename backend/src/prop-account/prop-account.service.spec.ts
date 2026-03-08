import { Test, TestingModule } from '@nestjs/testing';
import { PropAccountService } from './prop-account.service';

describe('PropAccountService', () => {
  let service: PropAccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropAccountService],
    }).compile();

    service = module.get<PropAccountService>(PropAccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
