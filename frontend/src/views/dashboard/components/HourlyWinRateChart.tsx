import React from 'react';
import { Box } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface HourlyData {
    [hour: number]: { wins: number; total: number };
}

interface HourlyWinRateChartProps {
    data: HourlyData;
}

const HourlyWinRateChart: React.FC<HourlyWinRateChartProps> = ({ data }) => {
    const chartData = Array.from({ length: 24 }).map((_, hour) => {
        const hourData = data[hour] || { wins: 0, total: 0 };
        const winRate = hourData.total > 0 ? (hourData.wins / hourData.total) * 100 : 0;
        return {
            hour: hour,
            displayHour: `${hour}h`,
            winRate: parseFloat(winRate.toFixed(1))
        };
    });

    return (
        <Box sx={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorHourlyWinRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#68d391" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#68d391" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="displayHour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} interval={2} />
                    <YAxis 
                        tick={{ fontSize: 10, fill: '#888' }} 
                        axisLine={false} 
                        tickLine={false}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`} 
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '4px', border: 'none' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: any) => [`${value}%`, 'Win Rate'] as any}
                        labelFormatter={(label) => `Hour: ${label}`}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="winRate" 
                        stroke="#68d391" 
                        fillOpacity={1} 
                        fill="url(#colorHourlyWinRate)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default HourlyWinRateChart;
