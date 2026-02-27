import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { TradesService } from './trades.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/trades')
export class TradesController {
    constructor(private readonly tradesService: TradesService) { }

    @Post('import')
    import(@Body() body: any[]) {
        return this.tradesService.importTrades(body);
    }

    @Get('dashboard')
    getDashboardStats() {
        return this.tradesService.getDashboardStats();
    }

    @Get()
    getTrades() {
        return this.tradesService.getTrades();
    }
}
