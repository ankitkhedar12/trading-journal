import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TradesService {
    constructor(private prisma: PrismaService) { }

    async importTrades(trades: any[]) {
        // Basic bulk insert or upsert using orderId to prevent duplicates
        const results = [];
        for (const trade of trades) {
            const saved = await this.prisma.trade.upsert({
                where: { orderId: trade.orderId },
                update: {},
                create: {
                    symbol: trade.symbol,
                    volume: String(trade.volume),
                    entryPrice: typeof trade.entryPrice === 'number' ? trade.entryPrice : parseFloat(trade.entryPrice),
                    closePrice: typeof trade.closePrice === 'number' ? trade.closePrice : parseFloat(trade.closePrice),
                    pnl: typeof trade.pnl === 'number' ? trade.pnl : parseFloat(trade.pnl),
                    netPnl: typeof trade.netPnl === 'number' ? trade.netPnl : parseFloat(trade.netPnl || trade.pnl),
                    chargesSwap: trade.chargesSwap || '0.00/0.00',
                    openedAt: new Date(this.parseDate(trade.openedAt)),
                    closedAt: trade.closedAt ? new Date(this.parseDate(trade.closedAt)) : new Date(this.parseDate(trade.openedAt)),
                    orderId: trade.orderId,
                    status: trade.status || 'Closed',
                }
            });
            results.push(saved);
        }
        return { count: results.length };
    }

    async getDashboardStats() {
        const allTrades = await this.prisma.trade.findMany({
            orderBy: { openedAt: 'asc' }
        });

        if (allTrades.length === 0) {
            return { chartData: [], quickStats: { total: 0, winRate: 0, largestLoss: 0 } };
        }

        const wins = allTrades.filter(t => t.pnl > 0);
        const winRate = ((wins.length / allTrades.length) * 100).toFixed(0);

        let largestLoss = 0;
        allTrades.forEach(t => {
            if (t.pnl < largestLoss) largestLoss = t.pnl;
        });

        // Generate cumulative Chart data
        let cumulative = 0;
        const chartData = allTrades.map(trade => {
            cumulative += trade.pnl;
            return {
                date: trade.openedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                pnl: parseFloat(cumulative.toFixed(2))
            };
        });

        return {
            chartData,
            quickStats: {
                total: allTrades.length,
                winRate: `${winRate}%`,
                largestLoss: `$${Math.abs(largestLoss).toFixed(2)}`
            }
        };
    }

    async getTrades() {
        return this.prisma.trade.findMany({
            orderBy: { openedAt: 'desc' }
        });
    }

    private parseDate(dateStr: string) {
        if (!dateStr) return new Date().toISOString();
        dateStr = String(dateStr).trim();

        // 1. If it's already a parseable format (e.g. ISO) without our intervention:
        const t = new Date(dateStr);
        if (!isNaN(t.getTime()) && dateStr.includes('-')) {
            return dateStr;
        }

        // 2. Unify separators (replace dots or dashes with slashes) if it looks like DD/MM/YYYY or YYYY.MM.DD
        let normalizedDateStr = dateStr.replace(/\./g, '/').replace(/-/g, '/');

        if (normalizedDateStr.includes('/')) {
            const parts = normalizedDateStr.split(' ');
            const datePart = parts[0];
            const timePart = parts.length > 1 ? parts[1] : '00:00:00';
            const dateChunks = datePart.split('/');

            if (dateChunks.length === 3) {
                let [p1, p2, p3] = dateChunks;

                // Keep only numeric characters for safe ISO parsing
                p1 = p1.replace(/\D/g, '');
                p2 = p2.replace(/\D/g, '');
                p3 = p3.replace(/\D/g, '');

                let yyyy, mm, dd;
                // Determine if first chunk is YYYY or DD
                if (p1.length === 4) {
                    yyyy = p1; mm = p2; dd = p3;
                } else if (p3.length === 4) {
                    dd = p1; mm = p2; yyyy = p3;
                }

                if (yyyy && mm && dd) {
                    mm = String(mm).padStart(2, '0');
                    dd = String(dd).padStart(2, '0');

                    let finalTime = timePart.replace(/[^\d:]/g, '');
                    if (!finalTime.includes(':')) {
                        finalTime = '00:00:00';
                    } else {
                        // explicitly pad times (e.g. 4:41:09 -> 04:41:09)
                        const tParts = finalTime.split(':');
                        finalTime = tParts.map(p => p.padStart(2, '0')).join(':');
                    }

                    return `${yyyy}-${mm}-${dd}T${finalTime}Z`;
                }
            }
        }

        // Fallback for timestamps missing date completely e.g. "19:18:44"
        if (dateStr.includes(':') && !dateStr.includes('/') && !dateStr.includes('-') && !dateStr.includes('.')) {
            let finalTime = dateStr.replace(/[^\d:]/g, '');
            if (finalTime.includes(':')) {
                const tParts = finalTime.split(':');
                finalTime = tParts.map(p => p.padStart(2, '0')).join(':');
            }
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}T${finalTime}Z`;
        }

        return new Date().toISOString(); // ultimate safe fallback to prevent database errors
    }
}
