import { Module } from '@nestjs/common';
import { PropAccountService } from './prop-account.service';
import { PropAccountController } from './prop-account.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PropAccountController],
  providers: [PropAccountService, PrismaService],
})
export class PropAccountModule {}
