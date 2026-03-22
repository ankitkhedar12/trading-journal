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
        let totalProfit = 0;
        let maxSingleDayProfit = 0;
        let totalWinDays = 0;
        let totalLossDays = 0;

        // Group trades by trading day and symbol for max risk rule
        const tradesByDay: Record<string, typeof allTrades> = {};
        const tradesByDayAndSymbol: Record<string, Record<string, number>> = {};

        allTrades.forEach(trade => {
            currentBalance += trade.pnl;

            const dayStr = trade.openedAt.toISOString().split('T')[0];

            if (!tradesByDay[dayStr]) tradesByDay[dayStr] = [];
            tradesByDay[dayStr].push(trade);

            if (!tradesByDayAndSymbol[dayStr]) tradesByDayAndSymbol[dayStr] = {};
            tradesByDayAndSymbol[dayStr][trade.symbol] = (tradesByDayAndSymbol[dayStr][trade.symbol] || 0) + trade.pnl;
        });

        const dayStrs = Object.keys(tradesByDay).sort();
        let validTradingDaysCount = 0;

        // Consistency & Win/Loss Day Logic
        dayStrs.forEach(dayStr => {
            const dayPnl = tradesByDay[dayStr].reduce((sum, t) => sum + t.pnl, 0);
            
            // A trading day is only counted when balance moves by 0.25% or more of initial balance
            if (Math.abs(dayPnl) >= initialBalance * 0.0025) {
                validTradingDaysCount++;
            }

            if (dayPnl > 0) {
                totalWinDays++;
                totalProfit += dayPnl;
                if (dayPnl > maxSingleDayProfit) maxSingleDayProfit = dayPnl;
            } else if (dayPnl < 0) {
                totalLossDays++;
            }
        });

        const consistencyScore = totalProfit > 0 ? (maxSingleDayProfit / totalProfit) * 100 : 0;

        // Prop Firm Rules Definition based on Images
        let dailyLossLimitPct = 0;
        let maxLossLimitPct = 0;
        let profitTargetPct = 0;
        let minDays = 0;
        let maxRiskPerSymbolPct = 0; // Only for 2-step funded

        if (account.accountType === '1_STEP') {
            dailyLossLimitPct = 3;
            maxLossLimitPct = 6;
            if (account.status === 'PHASE_1') {
                profitTargetPct = 10;
                minDays = 3;
            } else if (account.status === 'FUNDED') {
                maxRiskPerSymbolPct = 3;
            }
        } else if (account.accountType === '2_STEP') {
            dailyLossLimitPct = 5;
            maxLossLimitPct = 10;
            if (account.status === 'PHASE_1') {
                profitTargetPct = 8; minDays = 5;
            } else if (account.status === 'PHASE_2') {
                profitTargetPct = 5; minDays = 5;
            } else if (account.status === 'FUNDED') {
                maxRiskPerSymbolPct = 3;
            }
        } else if (account.accountType === 'INSTANT') {
            dailyLossLimitPct = 3;
            maxLossLimitPct = 6;
            minDays = 7;
        }

        const maxDailyLossAllowed = (initialBalance * dailyLossLimitPct) / 100;
        const maxTotalLossAllowed = (initialBalance * maxLossLimitPct) / 100;
        const targetProfitVal = (initialBalance * profitTargetPct) / 100;
        const maxRiskAllowedPerSymbol = (initialBalance * maxRiskPerSymbolPct) / 100;

        // Current Performance Checks
        let currentDayDrawdown = 0;
        const todayStartStr = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Calculate balance at start of today for drawdown check
        let balanceAtStartOfToday = initialBalance;
        allTrades.forEach(trade => {
            const dayStr = trade.openedAt.toISOString().split('T')[0];
            if (dayStr < todayStartStr) {
                balanceAtStartOfToday += trade.pnl;
            }
        });

        if (tradesByDay[todayStartStr]) {
            let runningBal = balanceAtStartOfToday;
            let lowestBal = balanceAtStartOfToday;
            tradesByDay[todayStartStr].forEach(t => {
                runningBal += t.pnl;
                if (runningBal < lowestBal) lowestBal = runningBal;
            });
            currentDayDrawdown = Math.max(0, balanceAtStartOfToday - lowestBal);
        }

        const currentTotalDrawdown = Math.max(0, initialBalance - currentBalance);
        const currentNetProfit = currentBalance - initialBalance;

        // Violation Detection (Max Risk)
        let maxRiskViolation = false;
        if (maxRiskPerSymbolPct > 0) {
            for (const day in tradesByDayAndSymbol) {
                for (const symbol in tradesByDayAndSymbol[day]) {
                    if (tradesByDayAndSymbol[day][symbol] <= -maxRiskAllowedPerSymbol) {
                        maxRiskViolation = true;
                        break;
                    }
                }
                if (maxRiskViolation) break;
            }
        }

        // HFT Check
        let currentHftViolations = 0;
        for (let i = 0; i < allTrades.length; i++) {
            const current = allTrades[i];
            if (!current.side) continue;
            
            let countInWindow = 1;
            for (let j = i + 1; j < allTrades.length; j++) {
                const next = allTrades[j];
                const diffMs = next.openedAt.getTime() - current.openedAt.getTime();
                if (diffMs > 3 * 60 * 1000) break;
                if (current.symbol === next.symbol && current.side === next.side) {
                    countInWindow++;
                }
            }
            if (countInWindow >= 4) {
                currentHftViolations++;
                i += (countInWindow - 1);
            }
        }

        // Automatic Status Transitions & Failures
        let updatedStatus = account.status;
        let violationMessage = null;
        let updatedHftWarning = account.hasHftWarning;

        if (currentHftViolations >= 2) {
            updatedStatus = 'FAILED';
            violationMessage = 'HFT Rule Violated (Multiple Offenses): 4+ orders on same asset/direction within 3 mins.';
        } else if (currentHftViolations === 1) {
            updatedHftWarning = true;
            if (updatedStatus !== 'FAILED') {
                violationMessage = 'HFT Warning Issued: 4+ orders on same asset/direction within 3 mins detected.';
            }
        }

        if (currentDayDrawdown >= maxDailyLossAllowed) {
            updatedStatus = 'FAILED';
            violationMessage = 'Daily Drawdown limit reached.';
        } else if (currentTotalDrawdown >= maxTotalLossAllowed) {
            updatedStatus = 'FAILED';
            violationMessage = 'Maximum Total Drawdown limit reached.';
        } else if (maxRiskViolation) {
            updatedStatus = 'FAILED';
            violationMessage = 'Max Risk Per Trade (Aggregated) exceeded 3%.';
        } else if (updatedStatus !== 'FAILED' && account.status !== 'FUNDED') {
            const reachedTarget = profitTargetPct > 0 && currentNetProfit >= targetProfitVal;
            const reachedMinDays = validTradingDaysCount >= minDays;

            if (reachedTarget && reachedMinDays) {
                if (account.accountType === '2_STEP' && account.status === 'PHASE_1') {
                    updatedStatus = 'PHASE_2';
                } else {
                    updatedStatus = 'FUNDED';
                }
            }
        }

        // If status or warning changed, save it
        if (updatedStatus !== account.status || updatedHftWarning !== account.hasHftWarning) {
            if (updatedStatus !== account.status) {
                await this.deleteTradesForFirm(userId, account.firmName);
            }
            await this.prisma.propAccount.update({
                where: { id: account.id },
                data: { status: updatedStatus, hasHftWarning: updatedHftWarning }
            });
            account.status = updatedStatus;
            account.hasHftWarning = updatedHftWarning;
        }

        // P&L Calendar mapped to UI format
        const profitCalendar = dayStrs.map(dayStr => {
            const pnl = tradesByDay[dayStr].reduce((sum, t) => sum + t.pnl, 0);
            return { date: dayStr, pnl: parseFloat(pnl.toFixed(2)), tradesCount: tradesByDay[dayStr].length };
        });

        const chartData: { date: string, value: number, symbol: string, tradePnl: number, fullDate: string, index: number }[] = [];
        let runningEq = initialBalance;
        allTrades.forEach((trade, index) => {
            runningEq += trade.pnl;
            chartData.push({ 
                index,
                date: trade.closedAt.toLocaleDateString(), 
                fullDate: trade.closedAt.toLocaleString(),
                symbol: trade.symbol,
                tradePnl: trade.pnl,
                value: parseFloat(runningEq.toFixed(2)) 
            });
        });

        return {
            account,
            violationMessage,
            metrics: {
                currentBalance,
                totalPnl: currentNetProfit,
                pnlPct: (currentNetProfit / initialBalance) * 100,
                winRate: allTrades.length > 0 ? `${((allTrades.filter(t => t.pnl > 0).length / allTrades.length) * 100).toFixed(0)}%` : '0%',
                tradingDays: validTradingDaysCount,
                totalTrades: allTrades.length,
                totalWinDays,
                totalLossDays,
            },
            rules: {
                dailyDrawdown: { current: currentDayDrawdown, limit: maxDailyLossAllowed },
                maxDrawdown: { current: currentTotalDrawdown, limit: maxTotalLossAllowed },
                profitTarget: { current: Math.max(0, currentNetProfit), limit: targetProfitVal, isActive: profitTargetPct > 0 },
                consistency: { currentPct: consistencyScore, limitPct: 15, isActive: account.accountType === 'INSTANT' },
                minDays: { current: validTradingDaysCount, limit: minDays },
                maxRisk: { currentPct: maxRiskPerSymbolPct > 0 ? (maxRiskViolation ? 100 : 0) : 0, limitPct: maxRiskPerSymbolPct, isActive: maxRiskPerSymbolPct > 0 }
            },
            chartData,
            profitCalendar
        };
    }

    async updateAccount(userId: string, id: string, data: any) {
        const account = await this.prisma.propAccount.findUnique({
            where: { id, userId }
        });

        if (!account) return null;

        const updateData: any = { ...data };
        if (data.status && data.status !== account.status) {
            await this.deleteTradesForFirm(userId, account.firmName);
        }
        
        // Remove id and userId from updateData to prevent issues
        delete updateData.id;
        delete updateData.userId;

        return this.prisma.propAccount.update({
            where: { id, userId },
            data: updateData
        });
    }

    async deleteAccount(userId: string, id: string) {
        const account = await this.prisma.propAccount.findUnique({
            where: { id, userId }
        });

        if (account) {
            await this.deleteTradesForFirm(userId, account.firmName);
        }

        return this.prisma.propAccount.delete({
            where: { id, userId }
        });
    }

    private async deleteTradesForFirm(userId: string, firmName: string) {
        const brokerTag = firmName.toLowerCase().replace(/\s+/g, '_');
        return this.prisma.trade.deleteMany({
            where: {
                userId,
                broker: brokerTag
            }
        });
    }
}
