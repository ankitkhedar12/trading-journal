import React from 'react';
import { Box } from '@mui/material';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface ProfitByMonthData {
    [monthStr: string]: number;
}

interface ProfitByMonthChartProps {
    data: ProfitByMonthData;
}

const ProfitByMonthChart: React.FC<ProfitByMonthChartProps> = ({ data }) => {
    // Sort keys (YYYY-MM) and map to charting data
    const chartData = Object.keys(data).sort().map(monthStr => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
            name: date.toLocaleString('default', { month: 'short' }) + ' ' + year.substring(2),
            pnl: parseFloat(data[monthStr].toFixed(2))
        };
    });

    return (
        <Box sx={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                    <YAxis 
                        tick={{ fontSize: 10, fill: '#888' }} 
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={(value) => `$${value >= 1000 ? value/1000 + 'k' : value <= -1000 ? value/1000 + 'k' : value}`} 
                    />
                    <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '4px', border: 'none' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: any) => [`${Number(value).toLocaleString()}`, 'P&L'] as any}
                    />
                    <ReferenceLine y={0} stroke="#888" strokeOpacity={0.5} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#68d391' : '#f56565'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default ProfitByMonthChart;
