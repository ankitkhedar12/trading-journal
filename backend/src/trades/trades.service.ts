import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

export interface TradeImportInput {
  symbol: string;
  volume: string | number;
  entryPrice: string | number;
  closePrice: string | number;
  pnl: string | number;
  netPnl?: string | number;
  chargesSwap?: string;
  openedAt: string;
  closedAt?: string;
  orderId: string;
  status?: string;
  side?: string;
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

  async importTrades(
    trades: TradeImportInput[],
    userId: string,
    broker: string,
    propAccountId?: string,
  ) {
    // Deduplicate the incoming trades list by orderId
    const tradesMap = new Map<string, TradeImportInput>();
    for (const trade of trades) {
      if (!trade.orderId) continue;
      const existing = tradesMap.get(trade.orderId);
      if (!existing) {
        tradesMap.set(trade.orderId, trade);
      } else {
        // Decide which one is better to keep
        const statusA = (existing.status || '').toLowerCase();
        const statusB = (trade.status || '').toLowerCase();

        let keepNew = false;
        if (statusB === 'closed' && statusA !== 'closed') {
          keepNew = true;
        } else if (statusA !== 'closed') {
          // If neither is closed, compare volume or pnl
          const getClosedVol = (volStr: string | number) => {
            if (!volStr) return 0;
            const parts = String(volStr).split('/');
            const val = parseFloat(parts[0]);
            return isNaN(val) ? 0 : val;
          };
          const volA = getClosedVol(existing.volume);
          const volB = getClosedVol(trade.volume);
          if (volB > volA) {
            keepNew = true;
          } else if (volB === volA) {
            const pnlA = Math.abs(parseFloat(String(existing.pnl)) || 0);
            const pnlB = Math.abs(parseFloat(String(trade.pnl)) || 0);
            if (pnlB > pnlA) {
              keepNew = true;
            }
          }
        }
        if (keepNew) {
          tradesMap.set(trade.orderId, trade);
        }
      }
    }

    const deduplicatedTrades = Array.from(tradesMap.values());
    if (deduplicatedTrades.length === 0) {
      return { count: 0, message: 'No valid trades found to import.' };
    }

    // Collect all orderIds from the import batch
    const orderIds = deduplicatedTrades.map((t) => t.orderId);

    // Find which ones already exist in the DB for this user
    const existingTrades = await this.prisma.trade.findMany({
      where: {
        userId,
        orderId: { in: orderIds },
      },
      select: {
        id: true,
        orderId: true,
        status: true,
        volume: true,
        pnl: true,
        closePrice: true,
      },
    });

    const existingMap = new Map(existingTrades.map((t) => [t.orderId, t]));

    let accountPhase: string | null = null;
    if (propAccountId) {
      const account = await this.prisma.propAccount.findUnique({
        where: { id: propAccountId },
      });
      if (account) {
        accountPhase = account.status;
      }
    }

    const tradesToCreate: TradeImportInput[] = [];
    const tradesToUpdate: {
      id: string;
      data: {
        symbol: string;
        volume: string;
        entryPrice: number;
        closePrice: number;
        pnl: number;
        netPnl: number;
        chargesSwap: string;
        openedAt: Date;
        closedAt: Date;
        status: string;
        side?: string;
        broker: string;
        propAccountId: string | null;
        accountPhase: string | null;
      };
    }[] = [];

    for (const trade of deduplicatedTrades) {
      const existing = existingMap.get(trade.orderId);
      if (!existing) {
        tradesToCreate.push(trade);
      } else {
        // Check if we should update.
        // We update if the status changed, or volume changed, or closePrice/pnl changed.
        const newVolume = String(trade.volume);
        const newPnl =
          typeof trade.pnl === 'number'
            ? trade.pnl
            : parseFloat(String(trade.pnl));
        const newNetPnl =
          typeof trade.netPnl === 'number'
            ? trade.netPnl
            : parseFloat(String(trade.netPnl || trade.pnl));
        const newStatus = trade.status || 'Closed';
        const newClosePrice =
          typeof trade.closePrice === 'number'
            ? trade.closePrice
            : parseFloat(String(trade.closePrice));

        if (
          existing.status !== newStatus ||
          existing.volume !== newVolume ||
          Math.abs(existing.pnl - newPnl) > 0.001 ||
          Math.abs(existing.closePrice - newClosePrice) > 0.001
        ) {
          tradesToUpdate.push({
            id: existing.id,
            data: {
              symbol: trade.symbol,
              volume: newVolume,
              entryPrice:
                typeof trade.entryPrice === 'number'
                  ? trade.entryPrice
                  : parseFloat(String(trade.entryPrice)),
              closePrice: newClosePrice,
              pnl: newPnl,
              netPnl: newNetPnl,
              chargesSwap: trade.chargesSwap || '0.00/0.00',
              openedAt: new Date(this.parseDate(trade.openedAt)),
              closedAt: trade.closedAt
                ? new Date(this.parseDate(trade.closedAt))
                : new Date(this.parseDate(trade.openedAt)),
              status: newStatus,
              side: trade.side,
              broker,
              propAccountId: propAccountId || null,
              accountPhase: accountPhase,
            },
          });
        }
      }
    }

    // Use createMany for high-performance bulk insertion of only the new trades
    if (tradesToCreate.length > 0) {
      await this.prisma.trade.createMany({
        data: tradesToCreate.map((trade) => ({
          symbol: trade.symbol,
          volume: String(trade.volume),
          entryPrice:
            typeof trade.entryPrice === 'number'
              ? trade.entryPrice
              : parseFloat(String(trade.entryPrice)),
          closePrice:
            typeof trade.closePrice === 'number'
              ? trade.closePrice
              : parseFloat(String(trade.closePrice)),
          pnl:
            typeof trade.pnl === 'number'
              ? trade.pnl
              : parseFloat(String(trade.pnl)),
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
    }

    // Perform updates for changed records
    for (const update of tradesToUpdate) {
      await this.prisma.trade.update({
        where: { id: update.id },
        data: update.data,
      });
    }

    return { count: tradesToCreate.length + tradesToUpdate.length };
  }

  async getDashboardStats(userId: string, broker?: string) {
    const where: Prisma.TradeWhereInput = { userId };
    if (broker) where.broker = broker;

    const allTrades = await this.prisma.trade.findMany({
      where,
      orderBy: { openedAt: 'asc' },
    });

    if (allTrades.length === 0) {
      return {
        chartData: [],
        quickStats: { total: 0, winRate: 0, largestLoss: 0 },
      };
    }

    const wins = allTrades.filter((t) => t.pnl > 0);
    const winRate = ((wins.length / allTrades.length) * 100).toFixed(0);

    let largestLoss = 0;
    allTrades.forEach((t) => {
      if (t.pnl < largestLoss) largestLoss = t.pnl;
    });

    let cumulative = 0;
    const chartData = allTrades.map((trade, index) => {
      cumulative += trade.pnl;
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

    return {
      chartData,
      quickStats: {
        total: allTrades.length,
        winRate: `${winRate}%`,
        largestLoss: `$${Math.abs(largestLoss).toFixed(2)}`,
      },
    };
  }

  async getTrades(userId: string, broker?: string) {
    const where: Prisma.TradeWhereInput = { userId };
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
