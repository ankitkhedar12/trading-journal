export interface ProgressBarProps {
    label: string;
    current: number;
    max: number;
    isGood: boolean;
    isCurrency?: boolean;
}

export interface CalendarData {
    [date: string]: {
        pnl: number;
        count: number;
    };
}

export interface ProfitCalendarProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    data: CalendarData;
    title?: string;
    onDayClick?: (date: Date) => void;
}

export interface AccountStatsCardProps {
    label: string;
    value: string | number;
    color: string;
    bg: string;
}
