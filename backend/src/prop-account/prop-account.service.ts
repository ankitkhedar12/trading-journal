import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PropAccountService {
  constructor(private prisma: PrismaService) {}

  async createAccount(userId: string, data: any) {
    return this.prisma.propAccount.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async getAccounts(userId: string) {
    return this.prisma.propAccount.findMany({ where: { userId } });
  }

  async getDashboard(userId: string, accountId?: string, phase?: string) {
    let account;
    if (accountId) {
      account = await this.prisma.propAccount.findFirst({
        where: { id: accountId, userId },
      });
    } else {
      account = await this.prisma.propAccount.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!account) return null;

    // Map human-readable firm names from the setup modal to the internal broker keys used during CSV import.
    const brokerKey =
      account.firmName === 'The Funded Room'
        ? 'the_funded_room'
        : account.firmName === 'Vantage'
          ? 'vantage'
          : account.firmName;

    let effectivePhase = phase;
    if (!effectivePhase) {
      const latestTrade = await this.prisma.trade.findFirst({
        where: { propAccountId: account.id },
        orderBy: { openedAt: 'desc' },
      });
      effectivePhase = latestTrade?.accountPhase || account.status;
    }

    const tradeWhere: any = {
      userId,
      propAccountId: account.id,
      status: { in: ['Closed', 'CLOSED', 'closed'] },
    };

    if (account.firmName !== 'Vantage') {
      tradeWhere.accountPhase = effectivePhase;
    }

    const allTrades = await this.prisma.trade.findMany({
      where: tradeWhere,
      orderBy: { openedAt: 'asc' },
    });

    // 1. Base Metrics
    const initialBalance = account.accountSize;
    const balanceAdj = account.balanceAdjustment || 0;
    let currentBalance = initialBalance + balanceAdj;
    let totalProfit = 0;
    let maxSingleDayProfit = 0;
    let totalWinDays = 0;
    let totalLossDays = 0;

    // Group trades by trading day and symbol for max risk rule
    const tradesByDay: Record<string, typeof allTrades> = {};
    const tradesByDayAndSymbol: Record<string, Record<string, number>> = {};

    allTrades.forEach((trade) => {
      currentBalance += trade.netPnl;

      const dayStr = trade.openedAt.toISOString().split('T')[0];

      if (!tradesByDay[dayStr]) tradesByDay[dayStr] = [];
      tradesByDay[dayStr].push(trade);

      if (!tradesByDayAndSymbol[dayStr]) tradesByDayAndSymbol[dayStr] = {};
      tradesByDayAndSymbol[dayStr][trade.symbol] =
        (tradesByDayAndSymbol[dayStr][trade.symbol] || 0) + trade.netPnl;
    });

    const dayStrs = Object.keys(tradesByDay).sort();
    let validTradingDaysCount = 0;

    // Consistency & Win/Loss Day Logic
    dayStrs.forEach((dayStr) => {
      const dayPnl = tradesByDay[dayStr].reduce((sum, t) => sum + t.netPnl, 0);

      // A trading day is only counted when balance moves by 0.25% or more of initial balance
      if (Math.abs(dayPnl) >= initialBalance * 0.0025) {
        validTradingDaysCount++;
      }

      if (dayPnl > maxSingleDayProfit) maxSingleDayProfit = dayPnl;
      if (dayPnl > 0) totalWinDays++;
      else if (dayPnl < 0) totalLossDays++;
    });

    // Add 1 more for current active day if not in closed trades list (simplification)

    // P&L Consistency Rule (No single day > 50% of total profit)
    let consistencyViolation = false;
    totalProfit = Math.max(0, currentBalance - initialBalance);
    const consistencyScore =
      totalProfit > 0 ? (maxSingleDayProfit / totalProfit) * 100 : 0;
    if (totalProfit > 0 && maxSingleDayProfit / totalProfit > 0.5) {
      consistencyViolation = true;
    }

    // Win Rate
    const totalClosedTrades = allTrades.length;
    const wonTrades = allTrades.filter((t) => t.netPnl > 0).length;
    const winRate =
      totalClosedTrades > 0 ? (wonTrades / totalClosedTrades) * 100 : 0;

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
        profitTargetPct = 8;
        minDays = 5;
      } else if (account.status === 'PHASE_2') {
        profitTargetPct = 5;
        minDays = 5;
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
    const maxRiskAllowedPerSymbol =
      (initialBalance * maxRiskPerSymbolPct) / 100;

    // Current Performance Checks
    let currentDayDrawdown = 0;
    const todayStartStr = new Date(Date.now() - 2 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Calculate balance at start of today for drawdown check
    let balanceAtStartOfToday = initialBalance + balanceAdj;
    allTrades.forEach((trade) => {
      const dayStr = trade.openedAt.toISOString().split('T')[0];
      if (dayStr < todayStartStr) {
        balanceAtStartOfToday += trade.netPnl;
      }
    });

    if (tradesByDay[todayStartStr]) {
      let runningBal = balanceAtStartOfToday;
      let lowestBal = balanceAtStartOfToday;
      tradesByDay[todayStartStr].forEach((t) => {
        runningBal += t.netPnl;
        if (runningBal < lowestBal) lowestBal = runningBal;
      });
      currentDayDrawdown = Math.max(0, balanceAtStartOfToday - lowestBal);
    }

    const currentTotalDrawdown = Math.max(0, initialBalance - currentBalance);
    const currentNetProfit = currentBalance - initialBalance;

    // Violation Detection (Max Risk)
    let maxRiskViolation = false;
    let maxAdversePctPerSymbol = 0;
    if (maxRiskPerSymbolPct > 0) {
      for (const day in tradesByDayAndSymbol) {
        for (const symbol in tradesByDayAndSymbol[day]) {
          const realisedPnl = tradesByDayAndSymbol[day][symbol];
          const lossPct =
            (Math.abs(Math.min(0, realisedPnl)) / initialBalance) * 100;
          if (lossPct > maxAdversePctPerSymbol)
            maxAdversePctPerSymbol = lossPct;

          if (realisedPnl <= -maxRiskAllowedPerSymbol) {
            maxRiskViolation = true;
          }
        }
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
        i += countInWindow - 1;
      }
    }

    // Automatic Status Transitions & Failures
    let updatedStatus = account.status;
    let violationMessage = null;
    let updatedHftWarning = account.hasHftWarning;

    if (currentHftViolations >= 2) {
      updatedStatus = 'FAILED';
      violationMessage =
        'HFT Rule Violated (Multiple Offenses): 4+ orders on same asset/direction within 3 mins.';
    } else if (currentHftViolations === 1) {
      updatedHftWarning = true;
      if (updatedStatus !== 'FAILED') {
        violationMessage =
          'HFT Warning Issued: 4+ orders on same asset/direction within 3 mins detected.';
      }
    }

    if (dailyLossLimitPct > 0 && currentDayDrawdown >= maxDailyLossAllowed) {
      updatedStatus = 'FAILED';
      violationMessage = 'Daily Drawdown limit reached.';
    } else if (
      maxLossLimitPct > 0 &&
      currentTotalDrawdown >= maxTotalLossAllowed
    ) {
      updatedStatus = 'FAILED';
      violationMessage = 'Maximum Total Drawdown limit reached.';
    } else if (maxRiskViolation) {
      updatedStatus = 'FAILED';
      violationMessage = 'Max Risk Per Trade (Aggregated) exceeded 3%.';
    } else if (
      updatedStatus !== 'FAILED' &&
      account.status !== 'FUNDED' &&
      account.firmName !== 'Vantage'
    ) {
      const reachedTarget =
        profitTargetPct > 0 && currentNetProfit >= targetProfitVal;
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
    if (
      updatedStatus !== account.status ||
      updatedHftWarning !== account.hasHftWarning
    ) {
      // We no longer delete trades on status change to keep stage history.
      await this.prisma.propAccount.update({
        where: { id: account.id },
        data: { status: updatedStatus, hasHftWarning: updatedHftWarning },
      });
      account.status = updatedStatus;
      account.hasHftWarning = updatedHftWarning;
    }

    // P&L Calendar mapped to UI format
    const profitCalendar = dayStrs.map((dayStr) => {
      const pnl = tradesByDay[dayStr].reduce((sum, t) => sum + t.netPnl, 0);
      return {
        date: dayStr,
        pnl: parseFloat(pnl.toFixed(2)),
        tradesCount: tradesByDay[dayStr].length,
      };
    });

    const chartData: {
      date: string;
      value: number;
      symbol: string;
      tradePnl: number;
      fullDate: string;
      index: number;
    }[] = [];
    let runningEq = initialBalance + balanceAdj;
    allTrades.forEach((trade, index) => {
      runningEq += trade.netPnl;
      chartData.push({
        index,
        date: trade.closedAt.toLocaleDateString(),
        fullDate: trade.closedAt.toLocaleString(),
        symbol: trade.symbol,
        tradePnl: trade.netPnl,
        value: parseFloat(runningEq.toFixed(2)),
      });
    });

    // Additional Insights (Profit Factor, RR, Best/Worst trade)
    const wins = allTrades.filter((t) => t.netPnl > 0);
    const losses = allTrades.filter((t) => t.netPnl < 0);

    const grossProfit = wins.reduce((sum, t) => sum + t.netPnl, 0);
    const grossLoss = losses.reduce((sum, t) => sum + t.netPnl, 0);

    const profitFactor =
      Math.abs(grossLoss) > 0
        ? parseFloat((grossProfit / Math.abs(grossLoss)).toFixed(2))
        : grossProfit > 0
          ? 99.9
          : 0;

    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    const riskRewardRatio =
      Math.abs(avgLoss) > 0
        ? parseFloat((avgWin / Math.abs(avgLoss)).toFixed(2))
        : avgWin > 0
          ? 99.9
          : 0;

    const bestTrade = allTrades.reduce(
      (max, t) => (t.netPnl > max ? t.netPnl : max),
      0,
    );
    const worstTrade = allTrades.reduce(
      (min, t) => (t.netPnl < min ? t.netPnl : min),
      0,
    );

    const perTradeExpectancy =
      allTrades.length > 0
        ? parseFloat((currentNetProfit / allTrades.length).toFixed(2))
        : 0;

    let totalHoldingMs = 0;
    const symbolStats: Record<string, { pnl: number; count: number }> = {};
    const drawdownCurve: { date: string; drawdown: number }[] = [];

    let peakEq = initialBalance + balanceAdj;
    let runningEqForDd = initialBalance + balanceAdj;

    const tradesByDuration: { durationHrs: number; pnl: number }[] = [];
    const tradesByTimeOfDay: { hour: number; pnl: number }[] = [];
    const profitByMonth: Record<string, number> = {};
    const profitByWeekDay: Record<number, number> = {};
    const profitByHour: Record<number, number> = {};
    const tradesByWeekDay: Record<number, { wins: number; total: number }> = {};
    const tradesByHour: Record<number, { wins: number; total: number }> = {};
    const yearlyPerformance: Record<
      number,
      Record<number, { pnl: number; count: number }>
    > = {};

    allTrades.forEach((t) => {
      const holdingMs = t.closedAt.getTime() - t.openedAt.getTime();
      totalHoldingMs += holdingMs;

      if (!symbolStats[t.symbol]) symbolStats[t.symbol] = { pnl: 0, count: 0 };
      symbolStats[t.symbol].pnl += t.netPnl;
      symbolStats[t.symbol].count += 1;

      runningEqForDd += t.netPnl;
      if (runningEqForDd > peakEq) peakEq = runningEqForDd;
      const currentDd = runningEqForDd - peakEq; // negative value
      drawdownCurve.push({
        date: t.closedAt.toLocaleString(),
        drawdown: parseFloat(currentDd.toFixed(2)),
      });

      const durationHrs = parseFloat((holdingMs / (1000 * 60 * 60)).toFixed(2));
      tradesByDuration.push({ durationHrs, pnl: t.netPnl });

      const hour = t.openedAt.getHours();
      const min = t.openedAt.getMinutes();
      const timeOfDay = parseFloat((hour + min / 60).toFixed(2));
      tradesByTimeOfDay.push({ hour: timeOfDay, pnl: t.netPnl });

      const monthStr = t.openedAt.toISOString().slice(0, 7); // YYYY-MM
      profitByMonth[monthStr] = (profitByMonth[monthStr] || 0) + t.netPnl;

      const dayOfWeek = t.openedAt.getDay();
      profitByWeekDay[dayOfWeek] = (profitByWeekDay[dayOfWeek] || 0) + t.netPnl;

      profitByHour[hour] = (profitByHour[hour] || 0) + t.netPnl;

      if (!tradesByWeekDay[dayOfWeek])
        tradesByWeekDay[dayOfWeek] = { wins: 0, total: 0 };
      tradesByWeekDay[dayOfWeek].total++;
      if (t.netPnl > 0) tradesByWeekDay[dayOfWeek].wins++;

      if (!tradesByHour[hour]) tradesByHour[hour] = { wins: 0, total: 0 };
      tradesByHour[hour].total++;
      if (t.netPnl > 0) tradesByHour[hour].wins++;

      const year = t.openedAt.getFullYear();
      const month = t.openedAt.getMonth();
      if (!yearlyPerformance[year]) yearlyPerformance[year] = {};
      if (!yearlyPerformance[year][month])
        yearlyPerformance[year][month] = { pnl: 0, count: 0 };
      yearlyPerformance[year][month].pnl += t.netPnl;
      yearlyPerformance[year][month].count++;
    });

    const avgHoldingMs =
      allTrades.length > 0 ? totalHoldingMs / allTrades.length : 0;
    const avgHoldingHours = Math.floor(avgHoldingMs / (1000 * 60 * 60));
    const avgHoldingMins = Math.floor(
      (avgHoldingMs % (1000 * 60 * 60)) / (1000 * 60),
    );
    const avgHoldingTime = `${avgHoldingHours}h ${avgHoldingMins}m`;

    const topSymbols = Object.keys(symbolStats)
      .map((s) => ({
        symbol: s,
        pnl: parseFloat(symbolStats[s].pnl.toFixed(2)),
        count: symbolStats[s].count,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);

    return {
      account,
      violationMessage,
      metrics: {
        currentBalance,
        totalPnl: currentNetProfit,
        pnlPct: (currentNetProfit / initialBalance) * 100,
        winRate:
          allTrades.length > 0
            ? `${((allTrades.filter((t) => t.netPnl > 0).length / allTrades.length) * 100).toFixed(0)}%`
            : '0%',
        tradingDays: validTradingDaysCount,
        totalTrades: allTrades.length,
        totalWinDays,
        totalLossDays,
        profitFactor,
        riskRewardRatio,
        bestTrade,
        worstTrade,
        perTradeExpectancy,
        avgHoldingTime,
      },
      rules: {
        dailyDrawdown: {
          current: currentDayDrawdown,
          limit: maxDailyLossAllowed,
        },
        maxDrawdown: {
          current: currentTotalDrawdown,
          limit: maxTotalLossAllowed,
        },
        profitTarget: {
          current: Math.max(0, currentNetProfit),
          limit: targetProfitVal,
          isActive: profitTargetPct > 0,
        },
        consistency: {
          currentPct: consistencyScore,
          limitPct: 15,
          isActive: account.accountType === 'INSTANT',
        },
        minDays: { current: validTradingDaysCount, limit: minDays },
        maxRisk: {
          current: parseFloat(maxAdversePctPerSymbol.toFixed(2)),
          limit: maxRiskPerSymbolPct,
          isActive: maxRiskPerSymbolPct > 0,
        },
      },
      chartData,
      profitCalendar,
      advancedMetrics: {
        topSymbols,
        drawdownCurve,
        tradesByDuration,
        tradesByTimeOfDay,
        profitByMonth,
        profitByWeekDay,
        profitByHour,
        tradesByWeekDay,
        tradesByHour,
        yearlyPerformance,
      },
    };
  }

  async updateAccount(userId: string, id: string, data: any) {
    const account = await this.prisma.propAccount.findUnique({
      where: { id, userId },
    });

    if (!account) return null;

    const updateData: any = { ...data };
    // We no longer delete trades on status change, preserving history.

    // Remove id and userId from updateData to prevent issues
    delete updateData.id;
    delete updateData.userId;

    return this.prisma.propAccount.update({
      where: { id, userId },
      data: updateData,
    });
  }

  async deleteAccount(userId: string, id: string) {
    const account = await this.prisma.propAccount.findUnique({
      where: { id, userId },
    });

    if (account) {
      await this.prisma.trade.deleteMany({
        where: {
          userId,
          propAccountId: account.id,
        },
      });
    }

    return this.prisma.propAccount.delete({
      where: { id, userId },
    });
  }
}
