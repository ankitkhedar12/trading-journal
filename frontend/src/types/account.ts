export interface SetupAccountDialogProps {
    open: boolean;
    onClose: () => void;
    firmName: string;
    setFirmName: (val: string) => void;
    accountType: string;
    setAccountType: (val: string) => void;
    accountSize: number;
    setAccountSize: (val: number) => void;
    status: string;
    setStatus: (val: string) => void;
    onCreate: () => void;
}

export interface EditAccountDialogProps {
    open: boolean;
    onClose: () => void;
    firmName: string;
    accountType: string;
    accountSize: number;
    status: string;
    setStatus: (status: string) => void;
    onUpdate: () => void;
}

export interface PropAccount {
    id: string;
    firmName: string;
    accountType: string;
    accountSize: number;
    status: string;
}

export interface AccountMetrics {
    currentBalance: number;
    totalPnl: number;
    pnlPct: number;
    winRate: string;
    tradingDays: number;
    totalTrades: number;
    totalWinDays: number;
    totalLossDays: number;
}

export interface RuleDetail {
    current: number;
    limit: number;
    isActive?: boolean;
    currentPct?: number;
    limitPct?: number;
}

export interface PropRules {
    dailyDrawdown: RuleDetail;
    maxDrawdown: RuleDetail;
    profitTarget: RuleDetail;
    consistency: RuleDetail;
    minDays: RuleDetail;
    maxRisk: RuleDetail;
}

export interface ChartDataPoint {
    date: string;
    value: number;
}

export interface CalendarDataPoint {
    date: string;
    pnl: number;
    tradesCount: number;
}

export interface PropDashboardData {
    account: PropAccount;
    violationMessage: string | null;
    metrics: AccountMetrics;
    rules: PropRules;
    chartData: ChartDataPoint[];
    profitCalendar: CalendarDataPoint[];
}

export interface AccountSetupCenterProps {
    openSetup: boolean;
    setOpenSetup: (open: boolean) => void;
    firmName: string;
    setFirmName: (val: string) => void;
    accountType: string;
    setAccountType: (val: string) => void;
    accountSize: number;
    setAccountSize: (val: number) => void;
    status: string;
    setStatus: (val: string) => void;
    onCreate: () => void;
}

export interface ObjectiveRulesProps {
    rules: PropRules;
}

export interface AccountMatrixProps {
    metrics: AccountMetrics;
    currentDate: Date;
    totalTradesThisMonth: number;
}
