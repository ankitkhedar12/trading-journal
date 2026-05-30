import React from 'react';
import { Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface HourlyData {
    [hour: number]: { wins: number; total: number };
}

interface HourlyTradingFrequencyChartProps {
    data: HourlyData;
}

const HourlyTradingFrequencyChart: React.FC<HourlyTradingFrequencyChartProps> = ({ data }) => {
    const chartData = Array.from({ length: 24 }).map((_, hour) => {
        const hourData = data[hour] || { wins: 0, total: 0 };
        return {
            hour: hour,
            total: hourData.total
        };
    });

    return (
        <Box sx={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} interval={2} />
                    <YAxis 
                        tick={{ fontSize: 10, fill: '#888' }} 
                        axisLine={false} 
                        tickLine={false}
                    />
                    <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '4px', border: 'none' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: number) => [value, 'Trades']}
                        labelFormatter={(label) => `Hour: ${label}`}
                    />
                    <Bar dataKey="total" fill="#68d391" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default HourlyTradingFrequencyChart;
