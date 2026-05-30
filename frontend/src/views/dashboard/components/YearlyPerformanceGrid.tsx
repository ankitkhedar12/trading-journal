import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface YearlyData {
    [year: string]: {
        [month: number]: { pnl: number; count: number };
    };
}

interface YearlyPerformanceGridProps {
    data: YearlyData;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const YearlyPerformanceGrid: React.FC<YearlyPerformanceGridProps> = ({ data }) => {
    const years = Object.keys(data).sort((a, b) => parseInt(b) - parseInt(a)); // Descending years

    return (
        <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ color: 'text.secondary', borderBottom: 'none', fontWeight: 'bold' }}>Year</TableCell>
                        {months.map(m => (
                            <TableCell key={m} align="center" sx={{ color: 'text.secondary', borderBottom: 'none', fontWeight: 'bold' }}>{m}</TableCell>
                        ))}
                        <TableCell align="center" sx={{ color: 'text.secondary', borderBottom: 'none', fontWeight: 'bold' }}>Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {years.map(year => {
                        const yearData = data[year as any] as any;
                        let yearlyTotal = 0;
                        let yearlyTrades = 0;

                        return (
                            <TableRow key={year}>
                                <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none', fontSize: 16 }}>{year}</TableCell>
                                {months.map((_, index) => {
                                    const monthData = yearData[index];
                                    if (monthData) {
                                        yearlyTotal += monthData.pnl;
                                        yearlyTrades += monthData.count;
                                    }
                                    const isPositive = monthData && monthData.pnl >= 0;
                                    // const isNegative = monthData && monthData.pnl < 0;

                                    return (
                                        <TableCell key={index} align="center" sx={{ borderBottom: 'none', p: 0.5 }}>
                                            {monthData ? (
                                                <Box sx={{ 
                                                    bgcolor: isPositive ? '#2e7d32' : '#d32f2f', 
                                                    color: '#fff', 
                                                    borderRadius: 1, 
                                                    py: 1.5, 
                                                    px: 1,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minWidth: 70
                                                }}>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {monthData.pnl < 0 ? '-' : ''}${Math.abs(monthData.pnl) >= 1000 ? (Math.abs(monthData.pnl)/1000).toFixed(2) + 'K' : Math.abs(monthData.pnl).toFixed(0)}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                                                        {monthData.count} trades
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Box sx={{ color: 'text.disabled', textAlign: 'center' }}>--</Box>
                                            )}
                                        </TableCell>
                                    );
                                })}
                                <TableCell align="center" sx={{ borderBottom: 'none', p: 0.5 }}>
                                    <Box sx={{ 
                                        color: yearlyTotal >= 0 ? '#2e7d32' : '#d32f2f', 
                                        borderRadius: 1, 
                                        py: 1.5, 
                                        px: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 70,
                                        border: '1px solid',
                                        borderColor: yearlyTotal >= 0 ? 'rgba(46, 125, 50, 0.3)' : 'rgba(211, 47, 47, 0.3)'
                                    }}>
                                        <Typography variant="body2" fontWeight="bold">
                                            {yearlyTotal < 0 ? '-' : ''}${Math.abs(yearlyTotal) >= 1000 ? (Math.abs(yearlyTotal)/1000).toFixed(2) + 'K' : Math.abs(yearlyTotal).toFixed(0)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.8, color: 'text.secondary' }}>
                                            {yearlyTrades} trades
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {years.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={14} align="center" sx={{ py: 3, color: 'text.secondary', borderBottom: 'none' }}>
                                No yearly performance data available
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default YearlyPerformanceGrid;
