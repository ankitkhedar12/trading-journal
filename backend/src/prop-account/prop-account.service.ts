import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PropAccountService {
    constructor(private prisma: PrismaService) { }

    async createAccount(userId: string, data: any) {
        return this.prisma.propAccount.create({
            data: {
                ...data,
                userId,
            }
        });
    }

    async getAccounts(userId: string) {
        return this.prisma.propAccount.findMany({ where: { userId } });
    }

    async deleteAccount(userId: string, id: string) {
        return this.prisma.propAccount.delete({
            where: { id, userId }
        });
    }

    async getDashboard(userId: string) {
        const account = await this.prisma.propAccount.findFirst({
            where: { userId }
        });

        if (!account) return null;

        // Map human-readable firm names from the setup modal to the internal broker keys used during CSV import.
        const brokerKey = account.firmName === 'The Funded Room' ? 'the_funded_room' :
                          account.firmName === 'Vantage' ? 'vantage' : account.firmName;

        const allTrades = await this.prisma.trade.findMany({
            where: { userId, broker: brokerKey },
            orderBy: { openedAt: 'asc' }
        });

        // 1. Base Metrics
        const initialBalance = account.accountSize;
        let currentBalance = initialBalance;
        let maxEquity = initialBalance;
        let maxDrawdownInUSD = 0;
        let totalWinDays = 0;
        let totalLossDays = 0;

        // Group trades by trading day (a trading day is 2AM UTC to 2AM UTC).
        const tradesByDay: Record<string, typeof allTrades> = {};

        allTrades.forEach(trade => {
            currentBalance += trade.pnl;

            const adjustedTime = new Date(trade.closedAt.getTime() - 2 * 60 * 60 * 1000); // subtract 2 hrs
            const dayStr = adjustedTime.toISOString().split('T')[0];

            if (!tradesByDay[dayStr]) tradesByDay[dayStr] = [];
            tradesByDay[dayStr].push(trade);
        });

        const dayStrs = Object.keys(tradesByDay).sort();

        // Prop Firm Daily Drawdown Logic:
        // We calculate the account balance exactly at the beginning of today (2 AM UTC).
        // Then we find the lowest equity dip DURING today relative to that start balance.
        let currentDayDrawdown = 0;
        const todayStartStr = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        let balanceAtStartOfToday = initialBalance;
        // Re-simulate to get balance at start of today
        allTrades.forEach(trade => {
            const adjustedTime = new Date(trade.closedAt.getTime() - 2 * 60 * 60 * 1000);
            const tradeDayStr = adjustedTime.toISOString().split('T')[0];
            
            if (tradeDayStr < todayStartStr) {
                balanceAtStartOfToday += trade.pnl;
            }
        });

        if (tradesByDay[todayStartStr]) {
            let intradayBalance = balanceAtStartOfToday;
            let lowestIntradayBalance = balanceAtStartOfToday;

            tradesByDay[todayStartStr].forEach(trade => {
                intradayBalance += trade.pnl;
                if (intradayBalance < lowestIntradayBalance) {
                    lowestIntradayBalance = intradayBalance;
                }
            });

            if (lowestIntradayBalance < balanceAtStartOfToday) {
                currentDayDrawdown = balanceAtStartOfToday - lowestIntradayBalance;
            }
        }

        // Calculate Max Total Drawdown (current distance to static failure limit from initial)
        // Static drawdown limit simply fails if equity drops below (Initial - MaxLossLimit). 
        // Thus "Current Drawdown" is just how much we are currently down from Initial.
        let currentTotalDrawdown = 0;
        if (currentBalance < initialBalance) {
            currentTotalDrawdown = initialBalance - currentBalance;
        }

        // Consistency Rule (Instant = 15%)
        let maxSingleDayProfit = 0;
        let totalProfitDays = 0;
        let totalProfit = 0;

        dayStrs.forEach(dayStr => {
            const pnl = tradesByDay[dayStr].reduce((sum, t) => sum + t.pnl, 0);
            if (pnl > 0) {
                totalWinDays++;
                totalProfit += pnl;
                if (pnl > maxSingleDayProfit) maxSingleDayProfit = pnl;
            } else if (pnl < 0) {
                totalLossDays++;
            }
        });

        const consistencyScore = totalProfit > 0 ? (maxSingleDayProfit / totalProfit) * 100 : 0;
        
        // Rules configuration logic
        let dailyLossLimitPct = 0;
        let maxLossLimitPct = 0;
        let profitTargetPct = 0;
        let minDays = 0;

        if (account.accountType === 'INSTANT') {
            dailyLossLimitPct = 3; maxLossLimitPct = 6; minDays = 7;
        } else if (account.accountType === '1_STEP') {
            dailyLossLimitPct = 3; maxLossLimitPct = 6; profitTargetPct = 10; minDays = 3;
        } else if (account.accountType === '2_STEP') {
            dailyLossLimitPct = 5; maxLossLimitPct = 10;
            profitTargetPct = account.status === 'PHASE_1' ? 8 : (account.status === 'PHASE_2' ? 5 : 0);
            minDays = account.status === 'FUNDED' ? 0 : 5;
        }

        const maxDailyLossAllowed = (initialBalance * dailyLossLimitPct) / 100;
        const maxTotalLossAllowed = (initialBalance * maxLossLimitPct) / 100;
        const targetProfitVal = (initialBalance * profitTargetPct) / 100;

        // P&L Calendar mapped to UI format
        const profitCalendar = dayStrs.map(dayStr => {
            const pnl = tradesByDay[dayStr].reduce((sum, t) => sum + t.pnl, 0);
            return {
                date: dayStr, // YYYY-MM-DD
                pnl: parseFloat(pnl.toFixed(2)),
                tradesCount: tradesByDay[dayStr].length
            };
        });

        // Equity Chart
        let eqCumulative = initialBalance;
        const chartData = allTrades.map(trade => {
            eqCumulative += trade.pnl;
            return {
                date: trade.closedAt.toLocaleDateString(),
                value: parseFloat(eqCumulative.toFixed(2))
            };
        });

        return {
            account,
            metrics: {
                currentBalance,
                totalPnl: currentBalance - initialBalance,
                pnlPct: ((currentBalance - initialBalance) / initialBalance) * 100,
                winRate: allTrades.length > 0 ? `${((allTrades.filter(t => t.pnl > 0).length / allTrades.length) * 100).toFixed(0)}%` : '0%',
                tradingDays: dayStrs.length,
                totalTrades: allTrades.length,
                totalWinDays,
                totalLossDays,
            },
            rules: {
                dailyDrawdown: {
                    current: currentDayDrawdown,
                    limit: maxDailyLossAllowed,
                    pct: (currentDayDrawdown / maxDailyLossAllowed) * 100
                },
                maxDrawdown: {
                    current: currentTotalDrawdown,
                    limit: maxTotalLossAllowed,
                    pct: (currentTotalDrawdown / maxTotalLossAllowed) * 100
                },
                profitTarget: {
                    current: Math.max(0, currentBalance - initialBalance),
                    limit: targetProfitVal,
                    isActive: profitTargetPct > 0
                },
                consistency: {
                    currentPct: consistencyScore,
                    limitPct: 15,
                    isActive: account.accountType === 'INSTANT'
                },
                minDays: {
                    current: dayStrs.length,
                    limit: minDays
                }
            },
            chartData,
            profitCalendar
        };
    }
}
