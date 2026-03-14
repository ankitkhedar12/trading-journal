export interface TooltipData {
    date: string;
    fullDate?: string;
    symbol?: string;
    tradePnl: number;
    pnl?: number; // cumulative
}

export interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        payload: TooltipData;
        value: number;
    }>;
}

export interface CustomDotProps {
    cx?: number;
    cy?: number;
    index?: number;
    payload?: TooltipData;
}

export interface EquityChartProps {
    data: Record<string, any>[];
    dataKey: string;
    dateKey?: string;
    strokeColor?: string;
    showDots?: boolean;
    referenceLineValue?: number;
    referenceLineLabel?: string;
    yAxisFormatter?: (val: number) => string;
    height?: number | string;
    margin?: { top: number; right: number; left: number; bottom: number };
}
