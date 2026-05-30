import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { TradesService } from './trades.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/trades')
export class TradesController {
    constructor(private readonly tradesService: TradesService) { }

    @Post('import')
    import(@Request() req: any, @Body() body: { trades: any[]; broker: string; propAccountId?: string }) {
        return this.tradesService.importTrades(body.trades, req.user.id, body.broker || 'vantage', body.propAccountId);
    }

    @Get('dashboard')
    getDashboardStats(@Request() req: any, @Query('broker') broker?: string) {
        return this.tradesService.getDashboardStats(req.user.id, broker);
    }

    @Get()
    getTrades(@Request() req: any, @Query('broker') broker?: string) {
        return this.tradesService.getTrades(req.user.id, broker);
    }

    @Patch(':id/pnl')
    updateTradePnl(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { pnl: number }
    ) {
        return this.tradesService.updateTradePnl(id, req.user.id, body.pnl);
    }
}

