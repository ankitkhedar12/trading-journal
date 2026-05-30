import React from 'react';
import { Box, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface WinRateGaugeProps {
    winRateStr: string;
}

const WinRateGauge: React.FC<WinRateGaugeProps> = ({ winRateStr }) => {
    const winRate = parseInt(winRateStr.replace('%', ''), 10) || 0;
    const lossRate = 100 - winRate;

    const data = [
        { name: 'Wins', value: winRate },
        { name: 'Losses', value: lossRate },
    ];

    const COLORS = ['#4caf50', '#f44336'];

    return (
        <Box sx={{ position: 'relative', width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <Box
                sx={{
                    position: 'absolute',
                    top: '70%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                }}
            >
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                    {winRate}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Win Rate
                </Typography>
            </Box>
        </Box>
    );
};

export default WinRateGauge;
