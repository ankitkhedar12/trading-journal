import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    ReferenceLine
} from 'recharts';
import { Box, Typography } from '@mui/material';

import type { EquityChartProps } from '../../types/chart';

import CustomDot from './CustomDot';
import CustomTooltip from './CustomTooltip';

const EquityChart: React.FC<EquityChartProps> = ({
    data,
    dataKey,
    dateKey = 'date',
    strokeColor = '#2196f3',
    showDots = false,
    referenceLineValue,
    referenceLineLabel = 'INITIAL',
    yAxisFormatter = (val: number) => `$${val.toLocaleString()}`,
    height = 350,
    margin = { top: 20, right: 30, left: 20, bottom: 10 }
}) => {
    if (!data || data.length === 0) {
        return (
            <Box sx={{
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: 2
            }}>
                <Typography color="text.secondary">No chart data available.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={margin}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(150, 150, 150, 0.1)"
                    />
                    <XAxis
                        dataKey="index"
                        tickFormatter={(idx) => data[idx]?.[dateKey] || ''}
                        tick={{ fill: '#888', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        tickFormatter={yAxisFormatter}
                        tick={{ fill: '#888', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {referenceLineValue !== undefined && (
                        <ReferenceLine
                            y={referenceLineValue}
                            stroke="rgba(150,150,150,0.4)"
                            strokeDasharray="5 5"
                            label={{ value: referenceLineLabel, position: 'right', fill: '#888', fontSize: 10 }}
                        />
                    )}

                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={strokeColor}
                        strokeWidth={4}
                        dot={showDots ? <CustomDot /> : false}
                        activeDot={showDots ? { r: 8, fill: '#fff', stroke: strokeColor, strokeWidth: 7 } : { r: 6, strokeWidth: 0 }}
                        animationDuration={2000}
                        animationEasing="ease-out"
                    />
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default EquityChart;
