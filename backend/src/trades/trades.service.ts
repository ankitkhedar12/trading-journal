import { Injectable }  from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TradesService {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        // Backfill any existing trades that don't have a userId
        const defaultUser = await this.prisma.user.findFirst();
        if (defaultUser) {
            await this.prisma.trade.updateMany({
                where: { userId: null },
                data: { userId: defaultUser.id },
            });
        }
    }

    async importTrades(trades: any[], userId: string, broker: string, propAccountId?: string) {
        // Collect all orderIds from the import batch
        const orderIds = trades.map(t => t.orderId);

        // Find which ones already exist in the DB for this user
        const existingTrades = await this.prisma.trade.findMany({
            where: {
                userId,
                orderId: { in: orderIds }
            },
            select: { orderId: true }
        });

        const existingSet = new Set(existingTrades.map(t => t.orderId));

        // Filter out trades that are already in the database
        const newTrades = trades.filter(t => !existingSet.has(t.orderId));

        if (newTrades.length === 0) {
            return { count: 0, message: 'All trades in this file have already been imported.' };
        }

        let accountPhase: string | null = null;
        if (propAccountId) {
            const account = await this.prisma.propAccount.findUnique({
                where: { id: propAccountId }
            });
            if (account) {
                accountPhase = account.status;
            }
        }

        // Use createMany for high-performance bulk insertion of only the new trades
        const result = await this.prisma.trade.createMany({
            data: newTrades.map(trade => ({
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
                side: trade.side,
                broker,
                userId,
                propAccountId: propAccountId || null,
                accountPhase: accountPhase,
            }))
        });

        return { count: result.count };
    }

    async getDashboardStats(userId: string, broker?: string) {
        const where: any = { userId };
        if (broker) where.broker = broker;

        const allTrades = await this.prisma.trade.findMany({
            where,
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

        let cumulative = 0;
        const chartData = allTrades.map((trade, index) => {
            cumulative += trade.pnl;
            return {
                index,
                date: trade.openedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: trade.openedAt.toLocaleString(),
                symbol: trade.symbol,
                tradePnl: trade.pnl,
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

    async getTrades(userId: string, broker?: string) {
        const where: any = { userId };
        if (broker) where.broker = broker;

        return this.prisma.trade.findMany({
            where,
            orderBy: { openedAt: 'desc' }
        });
    }

    async updateTradePnl(tradeId: string, userId: string, newPnl: number) {
        const trade = await this.prisma.trade.findFirst({
            where: { id: tradeId, userId }
        });

        if (!trade) {
            throw new Error('Trade not found or unauthorized');
        }

        return this.prisma.trade.update({
            where: { id: tradeId },
            data: { pnl: newPnl, netPnl: newPnl }
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
