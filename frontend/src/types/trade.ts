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

export interface PropAccount {
    id: string;
    firmName: string;
    accountType: string;
    accountSize: number;
    status: string;
}

export interface PropRuleValue {
    current: number;
    limit: number;
    isActive?: boolean;
    currentPct?: number;
    limitPct?: number;
}

export interface PropDashboardData {
    account: PropAccount;
    violationMessage: string | null;
    metrics: {
        currentBalance: number;
        totalPnl: number;
        pnlPct: number;
        winRate: string;
        tradingDays: number;
        totalTrades: number;
        totalWinDays: number;
        totalLossDays: number;
    };
    rules: {
        dailyDrawdown: PropRuleValue;
        maxDrawdown: PropRuleValue;
        profitTarget: PropRuleValue;
        consistency: PropRuleValue;
        minDays: PropRuleValue;
        maxRisk: PropRuleValue;
    };
    chartData: { date: string; value: number }[];
    profitCalendar: { date: string; pnl: number; tradesCount: number }[];
}
