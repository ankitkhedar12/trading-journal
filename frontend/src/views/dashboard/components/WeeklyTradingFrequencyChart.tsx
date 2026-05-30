import React from 'react';
import { Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface WeeklyData {
    [day: number]: { wins: number; total: number };
}

interface WeeklyTradingFrequencyChartProps {
    data: WeeklyData;
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WeeklyTradingFrequencyChart: React.FC<WeeklyTradingFrequencyChartProps> = ({ data }) => {
    const chartData = daysOfWeek.map((dayName, index) => {
        const dayData = data[index] || { wins: 0, total: 0 };
        return {
            name: dayName,
            total: dayData.total
        };
    }).reverse();

    return (
        <Box sx={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '4px', border: 'none' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: any) => [value, 'Trades'] as any}
                    />
                    <Bar dataKey="total" fill="#68d391" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default WeeklyTradingFrequencyChart;
