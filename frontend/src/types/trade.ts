export interface Trade {
    id: string;
    symbol: string;
    volume: string;
    entryPrice: number;
    closePrice: number;
    pnl: number;
    netPnl: number;
    chargesSwap: string;
    openedAt: string;
    closedAt: string;
    orderId: string;
    status: string;
    side?: 'Long' | 'Short';
    broker: string;
    propAccountId?: string;
    
    // Journal fields
    notes?: string;
    rating?: number;
    tags?: string[];
    strategy?: string;
    takeProfit?: number;
    stopLoss?: number;
}

export interface ChartPoint {
    date: string;
    pnl: number;
}

export interface DashboardStats {
    chartData: ChartPoint[];
    scatterData?: { id: string; volume: number; pnl: number; durationMinutes: number }[];
    histogramData?: { range: string; count: number }[];
    behavioralStats?: { winAfterWin: number; lossAfterWin: number; winAfterLoss: number; lossAfterLoss: number };
    quickStats: {
        total: number;
        winRate: string;
        largestLoss: string;
        largestProfit?: string;
        avgWin?: string;
        avgLoss?: string;
        avgTradePnl?: string;
        totalWins?: number;
        totalLosses?: number;
        totalBreakEven?: number;
        profitFactor?: string;
        expectedPayoff?: string;
        avgWinDurationMs?: number;
        avgLossDurationMs?: number;
    };
    streaks?: {
        maxWins: number;
        maxLosses: number;
    };
    breakdowns?: {
        symbols?: Record<string, { trades: number, win: number, loss: number, pnl: number }>;
        strategies?: Record<string, { trades: number, win: number, loss: number, pnl: number }>;
        tags?: Record<string, { trades: number, win: number, loss: number, pnl: number }>;
        longShort?: Record<string, { trades: number, win: number, loss: number, pnl: number }>;
        dayOfWeek?: Record<string, { trades: number, win: number, loss: number, pnl: number }>;
        hourOfDay?: Record<string, { trades: number, win: number, loss: number, pnl: number }>;
    };
}

export interface DayTradesModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    trades: Trade[];
}

export interface TradeWithViolation extends Trade {
    isViolation: boolean;
    violationType?: string;
}

export interface TradeItemProps {
    trade: Trade;
    index: number;
    isViolation?: boolean;
    violationType?: string;
}

export interface ReconstructedTrade {
    pair: string;
    direction: 'Long' | 'Short';
    entryTime: string;
    exitTime: string;
    entryOrders: any[];
    exitOrders: any[];
    entryLot: number;
    exitLot: number;
    avgEntryPrice: number;
    avgExitPrice: number;
}
