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
}

export interface ChartPoint {
    date: string;
    pnl: number;
}

export interface DashboardStats {
    chartData: ChartPoint[];
    quickStats: {
        total: number;
        winRate: string;
        largestLoss: string;
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
