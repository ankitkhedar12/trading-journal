import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface WebhookTradeData {
  accountId: string;
  orderId: string;
  symbol: string;
  volume: number | string;
  entryPrice: number;
  closePrice: number;
  pnl: number;
  commission?: number;
  swap?: number;
  side: string;
  openTime?: number;
  closeTime?: number;
}

export interface ImportedTradeData {
  orderId: string;
  symbol: string;
  volume: string | number;
  entryPrice: number | string;
  closePrice: number | string;
  pnl: number | string;
  netPnl?: number | string;
  chargesSwap?: string;
  openedAt: string;
  closedAt?: string;
  status?: string;
  side: string;
}

@Injectable()
export class TradesService {
  constructor(private prisma: PrismaService) {}

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

  async processWebhookTrade(data: WebhookTradeData) {
    if (!data || !data.accountId || !data.orderId) {
      throw new Error('Invalid webhook payload');
    }

    const propAccount = await this.prisma.propAccount.findUnique({
      where: { id: data.accountId },
    });

    if (!propAccount) {
      throw new Error('Prop account not found');
    }

    const existingTrade = await this.prisma.trade.findFirst({
      where: {
        userId: propAccount.userId,
        orderId: data.orderId,
      },
    });

    if (existingTrade) {
      return { message: 'Trade already exists' };
    }

    const openedAt = data.openTime
      ? new Date(Number(data.openTime) * 1000)
      : new Date();
    const closedAt = data.closeTime
      ? new Date(Number(data.closeTime) * 1000)
      : new Date();

    const trade = await this.prisma.trade.create({
      data: {
        symbol: data.symbol,
        volume: String(data.volume),
        entryPrice: data.entryPrice,
        closePrice: data.closePrice,
        pnl: data.pnl,
        netPnl: data.pnl + (data.commission || 0) + (data.swap || 0),
        chargesSwap: `${(data.commission || 0).toFixed(2)}/${(data.swap || 0).toFixed(2)}`,
        openedAt,
        closedAt,
        orderId: data.orderId,
        status: 'Closed',
        side: data.side,
        broker:
          propAccount.firmName === 'Vantage'
            ? 'vantage'
            : propAccount.firmName.toLowerCase(),
        userId: propAccount.userId,
        propAccountId: propAccount.id,
        accountPhase:
          propAccount.firmName === 'Vantage' ? null : propAccount.status,
      },
    });

    return { message: 'Trade processed successfully', trade };
  }

  async importTrades(
    trades: ImportedTradeData[],
    userId: string,
    broker: string,
    propAccountId?: string,
  ) {
    // Collect all orderIds from the import batch
    const orderIds = trades.map((t) => t.orderId);

    // Find which ones already exist in the DB for this user
    const existingTrades = await this.prisma.trade.findMany({
      where: {
        userId,
        orderId: { in: orderIds },
      },
      select: { orderId: true },
    });

    const existingSet = new Set(existingTrades.map((t) => t.orderId));

    // Filter out trades that are already in the database
    const newTrades = trades.filter((t) => !existingSet.has(t.orderId));

    if (newTrades.length === 0) {
      return {
        count: 0,
        message: 'All trades in this file have already been imported.',
      };
    }

    let accountPhase: string | null = null;
    if (propAccountId) {
      const account = await this.prisma.propAccount.findUnique({
        where: { id: propAccountId },
      });
      if (account) {
        accountPhase = account.status;
      }
    }

    // Use createMany for high-performance bulk insertion of only the new trades
    const result = await this.prisma.trade.createMany({
      data: newTrades.map((trade) => ({
        symbol: trade.symbol,
        volume: String(trade.volume),
        entryPrice:
          typeof trade.entryPrice === 'number'
            ? trade.entryPrice
            : parseFloat(trade.entryPrice),
        closePrice:
          typeof trade.closePrice === 'number'
            ? trade.closePrice
            : parseFloat(trade.closePrice),
        pnl: typeof trade.pnl === 'number' ? trade.pnl : parseFloat(trade.pnl),
        netPnl:
          typeof trade.netPnl === 'number'
            ? trade.netPnl
            : parseFloat(String(trade.netPnl || trade.pnl)),
        chargesSwap: trade.chargesSwap || '0.00/0.00',
        openedAt: new Date(this.parseDate(trade.openedAt)),
        closedAt: trade.closedAt
          ? new Date(this.parseDate(trade.closedAt))
          : new Date(this.parseDate(trade.openedAt)),
        orderId: trade.orderId,
        status: trade.status || 'Closed',
        side: trade.side,
        broker,
        userId,
        propAccountId: propAccountId || null,
        accountPhase: accountPhase,
      })),
    });

    return { count: result.count };
  }

  async getDashboardStats(userId: string, broker?: string, accountId?: string) {
    const where: Record<string, any> = { userId };
    if (broker && broker !== 'ALL') where.broker = broker;
    if (accountId && accountId !== 'ALL') where.propAccountId = accountId;

    const allTrades = await this.prisma.trade.findMany({
      where,
      orderBy: { openedAt: 'asc' },
    });

    if (allTrades.length === 0) {
      return {
        chartData: [],
        scatterData: [],
        histogramData: [],
        behavioralStats: { winAfterWin: 0, lossAfterWin: 0, winAfterLoss: 0, lossAfterLoss: 0 },
        quickStats: { total: 0, winRate: 0, largestLoss: 0 },
        streaks: { maxWins: 0, maxLosses: 0, currentWins: 0, currentLosses: 0 },
        breakdowns: { symbols: {}, strategies: {}, tags: {} }
      };
    }

    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    let totalWins = 0;
    let totalLosses = 0;
    let totalBreakEven = 0;
    
    let totalWinPnl = 0;
    let totalLossPnl = 0;
    let largestProfit = 0;
    let largestLoss = 0;

    const symbolBreakdown: Record<string, { trades: number, win: number, loss: number, pnl: number }> = {};
    const strategyBreakdown: Record<string, { trades: number, win: number, loss: number, pnl: number }> = {};
    const tagsBreakdown: Record<string, { trades: number, win: number, loss: number, pnl: number }> = {};

    const longShortBreakdown = {
      long: { trades: 0, win: 0, loss: 0, pnl: 0 },
      short: { trades: 0, win: 0, loss: 0, pnl: 0 }
    };
    
    const dayOfWeekBreakdown: Record<string, { trades: number, win: number, loss: number, pnl: number }> = {};
    const hourOfDayBreakdown: Record<string, { trades: number, win: number, loss: number, pnl: number }> = {};
    
    let totalWinDuration = 0;
    let totalLossDuration = 0;

    const scatterData: any[] = [];
    const histogramBuckets = { '<-$500': 0, '-$500 to -$100': 0, '-$100 to $0': 0, '$0 to $100': 0, '$100 to $500': 0, '>$500': 0 };

    let winAfterWin = 0, lossAfterWin = 0;
    let winAfterLoss = 0, lossAfterLoss = 0;
    let previousTradePnl: number | null = null;

    let cumulative = 0;
    const chartData = allTrades.map((trade, index) => {
      cumulative += trade.pnl;
      
      const durationMs = trade.closedAt ? trade.closedAt.getTime() - trade.openedAt.getTime() : 0;

      // Scatter Data
      scatterData.push({
        id: trade.id,
        volume: Number(trade.volume),
        pnl: trade.pnl,
        durationMinutes: durationMs / (1000 * 60)
      });

      // Histogram Data
      if (trade.pnl < -500) histogramBuckets['<-$500']++;
      else if (trade.pnl < -100) histogramBuckets['-$500 to -$100']++;
      else if (trade.pnl < 0) histogramBuckets['-$100 to $0']++;
      else if (trade.pnl <= 100) histogramBuckets['$0 to $100']++;
      else if (trade.pnl <= 500) histogramBuckets['$100 to $500']++;
      else histogramBuckets['>$500']++;

      // Behavioral Stats
      if (previousTradePnl !== null) {
        if (previousTradePnl > 0) {
          if (trade.pnl > 0) winAfterWin++;
          else if (trade.pnl < 0) lossAfterWin++;
        } else if (previousTradePnl < 0) {
          if (trade.pnl > 0) winAfterLoss++;
          else if (trade.pnl < 0) lossAfterLoss++;
        }
      }
      previousTradePnl = trade.pnl;

      if (trade.pnl > 0) {
        totalWins++;
        totalWinPnl += trade.pnl;
        totalWinDuration += durationMs;
        if (trade.pnl > largestProfit) largestProfit = trade.pnl;
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxConsecutiveWins) maxConsecutiveWins = currentWinStreak;
      } else if (trade.pnl < 0) {
        totalLosses++;
        totalLossPnl += trade.pnl;
        totalLossDuration += durationMs;
        if (trade.pnl < largestLoss) largestLoss = trade.pnl;
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxConsecutiveLosses) maxConsecutiveLosses = currentLossStreak;
      } else {
        totalBreakEven++;
        currentWinStreak = 0;
        currentLossStreak = 0;
      }

      // Symbol breakdown
      if (!symbolBreakdown[trade.symbol]) symbolBreakdown[trade.symbol] = { trades: 0, win: 0, loss: 0, pnl: 0 };
      symbolBreakdown[trade.symbol].trades++;
      symbolBreakdown[trade.symbol].pnl += trade.pnl;
      if (trade.pnl > 0) symbolBreakdown[trade.symbol].win++;
      else if (trade.pnl < 0) symbolBreakdown[trade.symbol].loss++;

      // Strategy breakdown
      if (trade.strategy) {
        if (!strategyBreakdown[trade.strategy]) strategyBreakdown[trade.strategy] = { trades: 0, win: 0, loss: 0, pnl: 0 };
        strategyBreakdown[trade.strategy].trades++;
        strategyBreakdown[trade.strategy].pnl += trade.pnl;
        if (trade.pnl > 0) strategyBreakdown[trade.strategy].win++;
        else if (trade.pnl < 0) strategyBreakdown[trade.strategy].loss++;
      }

      // Tags breakdown
      if (trade.tags && trade.tags.length > 0) {
        trade.tags.forEach(tag => {
          if (!tagsBreakdown[tag]) tagsBreakdown[tag] = { trades: 0, win: 0, loss: 0, pnl: 0 };
          tagsBreakdown[tag].trades++;
          tagsBreakdown[tag].pnl += trade.pnl;
          if (trade.pnl > 0) tagsBreakdown[tag].win++;
          else if (trade.pnl < 0) tagsBreakdown[tag].loss++;
        });
      }

      // Long / Short breakdown
      const side = (String(trade.side).toLowerCase() === 'buy' || String(trade.side) === '0' || String(trade.side).toLowerCase() === 'long') ? 'long' : 'short';
      longShortBreakdown[side].trades++;
      longShortBreakdown[side].pnl += trade.pnl;
      if (trade.pnl > 0) longShortBreakdown[side].win++;
      else if (trade.pnl < 0) longShortBreakdown[side].loss++;

      // Day of Week breakdown
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[trade.openedAt.getDay()];
      if (!dayOfWeekBreakdown[dayName]) dayOfWeekBreakdown[dayName] = { trades: 0, win: 0, loss: 0, pnl: 0 };
      dayOfWeekBreakdown[dayName].trades++;
      dayOfWeekBreakdown[dayName].pnl += trade.pnl;
      if (trade.pnl > 0) dayOfWeekBreakdown[dayName].win++;
      else if (trade.pnl < 0) dayOfWeekBreakdown[dayName].loss++;

      // Hour of Day breakdown
      const hourStr = `${trade.openedAt.getHours().toString().padStart(2, '0')}:00`;
      if (!hourOfDayBreakdown[hourStr]) hourOfDayBreakdown[hourStr] = { trades: 0, win: 0, loss: 0, pnl: 0 };
      hourOfDayBreakdown[hourStr].trades++;
      hourOfDayBreakdown[hourStr].pnl += trade.pnl;
      if (trade.pnl > 0) hourOfDayBreakdown[hourStr].win++;
      else if (trade.pnl < 0) hourOfDayBreakdown[hourStr].loss++;

      return {
        index,
        date: trade.openedAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        fullDate: trade.openedAt.toLocaleString(),
        symbol: trade.symbol,
        tradePnl: trade.pnl,
        pnl: parseFloat(cumulative.toFixed(2)),
      };
    });

    const winRate = ((totalWins / allTrades.length) * 100).toFixed(0);
    const avgWin = totalWins > 0 ? (totalWinPnl / totalWins) : 0;
    const avgLoss = totalLosses > 0 ? (totalLossPnl / totalLosses) : 0;
    const avgTradePnl = allTrades.length > 0 ? (cumulative / allTrades.length) : 0;
    
    // Advanced metrics
    const profitFactor = Math.abs(totalLossPnl) > 0 ? (totalWinPnl / Math.abs(totalLossPnl)) : totalWinPnl > 0 ? 999 : 0;
    const expectedPayoff = avgTradePnl; // mathematically identical to (avgWin * winRate - avgLoss * lossRate)
    
    // Durations
    const avgWinDurationMs = totalWins > 0 ? (totalWinDuration / totalWins) : 0;
    const avgLossDurationMs = totalLosses > 0 ? (totalLossDuration / totalLosses) : 0;

    const totalAfterWin = winAfterWin + lossAfterWin;
    const totalAfterLoss = winAfterLoss + lossAfterLoss;

    const behavioralStats = {
      winAfterWin: totalAfterWin > 0 ? (winAfterWin / totalAfterWin) * 100 : 0,
      lossAfterWin: totalAfterWin > 0 ? (lossAfterWin / totalAfterWin) * 100 : 0,
      winAfterLoss: totalAfterLoss > 0 ? (winAfterLoss / totalAfterLoss) * 100 : 0,
      lossAfterLoss: totalAfterLoss > 0 ? (lossAfterLoss / totalAfterLoss) * 100 : 0
    };

    const histogramData = Object.entries(histogramBuckets).map(([range, count]) => ({ range, count }));

    return {
      chartData,
      scatterData,
      histogramData,
      behavioralStats,
      quickStats: {
        total: allTrades.length,
        winRate: `${winRate}%`,
        largestLoss: `$${Math.abs(largestLoss).toFixed(2)}`,
        largestProfit: `$${largestProfit.toFixed(2)}`,
        avgWin: `$${avgWin.toFixed(2)}`,
        avgLoss: `$${avgLoss.toFixed(2)}`,
        avgTradePnl: `$${avgTradePnl.toFixed(2)}`,
        totalWins,
        totalLosses,
        totalBreakEven,
        profitFactor: profitFactor.toFixed(2),
        expectedPayoff: `$${expectedPayoff.toFixed(2)}`,
        avgWinDurationMs,
        avgLossDurationMs
      },
      streaks: {
        maxWins: maxConsecutiveWins,
        maxLosses: maxConsecutiveLosses,
        currentWins: currentWinStreak,
        currentLosses: currentLossStreak
      },
      breakdowns: {
        symbols: symbolBreakdown,
        strategies: strategyBreakdown,
        tags: tagsBreakdown,
        longShort: longShortBreakdown,
        dayOfWeek: dayOfWeekBreakdown,
        hourOfDay: hourOfDayBreakdown
      }
    };
  }

  async getTrades(userId: string, broker?: string) {
    const where: Record<string, any> = { userId };
    if (broker) where.broker = broker;

    return this.prisma.trade.findMany({
      where,
      orderBy: { openedAt: 'desc' },
    });
  }

  async updateTradePnl(tradeId: string, userId: string, newPnl: number) {
    const trade = await this.prisma.trade.findFirst({
      where: { id: tradeId, userId },
    });

    if (!trade) {
      throw new Error('Trade not found or unauthorized');
    }

    return this.prisma.trade.update({
      where: { id: tradeId },
      data: { pnl: newPnl, netPnl: newPnl },
    });
  }

  async updateTrade(
    tradeId: string,
    userId: string,
    data: {
      notes?: string;
      rating?: number;
      tags?: string[];
      strategy?: string;
      takeProfit?: number;
      stopLoss?: number;
    },
  ) {
    const trade = await this.prisma.trade.findFirst({
      where: { id: tradeId, userId },
    });

    if (!trade) {
      throw new Error('Trade not found or unauthorized');
    }

    return this.prisma.trade.update({
      where: { id: tradeId },
      data: {
        notes: data.notes !== undefined ? data.notes : undefined,
        rating: data.rating !== undefined ? data.rating : undefined,
        tags: data.tags !== undefined ? data.tags : undefined,
        strategy: data.strategy !== undefined ? data.strategy : undefined,
        takeProfit: data.takeProfit !== undefined ? data.takeProfit : undefined,
        stopLoss: data.stopLoss !== undefined ? data.stopLoss : undefined,
      },
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
    const normalizedDateStr = dateStr.replace(/\./g, '/').replace(/-/g, '/');

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
          yyyy = p1;
          mm = p2;
          dd = p3;
        } else if (p3.length === 4) {
          dd = p1;
          mm = p2;
          yyyy = p3;
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
            finalTime = tParts.map((p) => p.padStart(2, '0')).join(':');
          }

          return `${yyyy}-${mm}-${dd}T${finalTime}Z`;
        }
      }
    }

    // Fallback for timestamps missing date completely e.g. "19:18:44"
    if (
      dateStr.includes(':') &&
      !dateStr.includes('/') &&
      !dateStr.includes('-') &&
      !dateStr.includes('.')
    ) {
      let finalTime = dateStr.replace(/[^\d:]/g, '');
      if (finalTime.includes(':')) {
        const tParts = finalTime.split(':');
        finalTime = tParts.map((p) => p.padStart(2, '0')).join(':');
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
