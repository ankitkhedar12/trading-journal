import React from 'react';
import { Box, Typography } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DrawdownData {
    date: string;
    drawdown: number;
}

interface DrawdownCurveProps {
    data: DrawdownData[];
}

const DrawdownCurve: React.FC<DrawdownCurveProps> = ({ data }) => {
    return (
        <Box sx={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f44336" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f44336" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <YAxis 
                        tick={{ fontSize: 11, fill: '#888' }} 
                        tickFormatter={(value) => `$${value}`} 
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Drawdown']}
                        labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="drawdown" 
                        stroke="#f44336" 
                        fillOpacity={1} 
                        fill="url(#colorDrawdown)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default DrawdownCurve;
