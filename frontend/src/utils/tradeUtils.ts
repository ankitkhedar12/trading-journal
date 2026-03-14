import type { Trade, TradeWithViolation } from '../types/trade';
import { format } from 'date-fns';

/**
 * Aggregates trades into daily P&L and trade counts for the ProfitCalendar.
 */
export const formatCalendarData = (trades: Trade[]): Record<string, { pnl: number, count: number }> => {
    const map: Record<string, { pnl: number, count: number }> = {};
    if (trades && trades.length > 0) {
        trades.forEach((t) => {
            const dateStr = format(new Date(t.openedAt), 'yyyy-MM-dd');
            if (!map[dateStr]) map[dateStr] = { pnl: 0, count: 0 };
            map[dateStr].pnl += t.pnl;
            map[dateStr].count += 1;
        });
    }
    return map;
};

/**
 * Detects HFT (High Frequency Trading) and Hedging violations in a list of trades.
 * 
 * Rules:
 * 1. HFT: 4+ trades in same direction in 3 mins on the same symbol.
 * 2. Hedging: Overlapping opposite trades on the same symbol.
 */
export const detectTradeViolations = (trades: Trade[]): TradeWithViolation[] => {
    return trades.map((trade, _, all): TradeWithViolation => {
        const openTime = new Date(trade.openedAt).getTime();
        const closeTime = new Date(trade.closedAt).getTime();
        const side = trade.side || 'Long';

        // 1. HFT Detection 
        const threeMins = 3 * 60 * 1000;
        const hftGroup = all.filter(t =>
            t.symbol === trade.symbol &&
            (t.side === side || (!t.side && side === 'Long')) &&
            Math.abs(new Date(t.openedAt).getTime() - openTime) <= threeMins
        );

        if (hftGroup.length >= 4) {
            return {
                ...trade,
                isViolation: true,
                violationType: `HFT (${side.toUpperCase()})`
            };
        }

        // 2. Hedging Detection (Overlapping opposite trades)
        const hedgingTrade = all.find(t =>
            t.id !== trade.id &&
            t.symbol === trade.symbol &&
            t.side && trade.side && t.side !== trade.side &&
            new Date(t.openedAt).getTime() < closeTime &&
            new Date(t.closedAt).getTime() > openTime
        );

        if (hedgingTrade) {
            return {
                ...trade,
                isViolation: true,
                violationType: 'Hedging'
            };
        }

        return { ...trade, isViolation: false };
    });
};

/**
 * Formats a currency value.
 */
export const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(val);
};

/**
 * Higher-level parser/matcher for brokers.
 */
export const getBrokerKeyFromFirmName = (firmName: string): string => {
    const map: Record<string, string> = {
        'The Funded Room': 'the_funded_room',
        'Vantage': 'vantage',
    };
    return map[firmName] || firmName.toLowerCase().replace(/\s+/g, '_');
};
