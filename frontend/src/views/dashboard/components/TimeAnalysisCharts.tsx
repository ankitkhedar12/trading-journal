import React from 'react';
import { Box, Typography } from '@mui/material';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TimeData {
    hour?: number;
    durationHrs?: number;
    pnl: number;
}

interface TimeAnalysisChartsProps {
    durationData: TimeData[];
    timeOfDayData: TimeData[];
}

const TimeAnalysisCharts: React.FC<TimeAnalysisChartsProps> = ({ durationData }) => {
    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* <Box sx={{ height: 200 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>PnL by Time of Day (Hour)</Typography>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis 
                            type="number" 
                            dataKey="hour" 
                            name="Hour" 
                            domain={[0, 24]} 
                            tick={{ fontSize: 11, fill: '#888' }}
                        />
                        <YAxis 
                            type="number" 
                            dataKey="pnl" 
                            name="PnL" 
                            tick={{ fontSize: 11, fill: '#888' }}
                            tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }} 
                            contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value: any, name: any) => name === 'PnL' ? `$${value.toFixed(2)}` : value.toFixed(1)}
                        />
                        <Scatter name="Trades" data={timeOfDayData} fill="#2196f3" fillOpacity={0.6} />
                    </ScatterChart>
                </ResponsiveContainer>
            </Box> */}

            <Box sx={{ height: 200 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>PnL by Duration (Hours)</Typography>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis
                            type="number"
                            dataKey="durationHrs"
                            name="Duration"
                            tick={{ fontSize: 11, fill: '#888' }}
                        />
                        <YAxis
                            type="number"
                            dataKey="pnl"
                            name="PnL"
                            tick={{ fontSize: 11, fill: '#888' }}
                            tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value: any, name: any) => name === 'PnL' ? `$${value.toFixed(2)}` : value.toFixed(1)}
                        />
                        <Scatter name="Trades" data={durationData}>
                            {durationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#68d391' : '#f56565'} fillOpacity={0.7} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default TimeAnalysisCharts;
