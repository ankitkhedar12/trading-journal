import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JournalModule } from './journal/journal.module';
import { TradesModule } from './trades/trades.module';
import { PropAccountModule } from './prop-account/prop-account.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    JournalModule,
    TradesModule,
    PropAccountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
