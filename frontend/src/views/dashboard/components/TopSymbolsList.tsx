import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface SymbolData {
    symbol: string;
    pnl: number;
    count: number;
}

interface TopSymbolsListProps {
    data: SymbolData[];
}

const TopSymbolsList: React.FC<TopSymbolsListProps> = ({ data }) => {
    return (
        <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Symbol</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Trades</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>P&L</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.slice(0, 5).map((row) => (
                        <TableRow key={row.symbol} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {row.symbol}
                            </TableCell>
                            <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{row.count}</TableCell>
                            <TableCell align="right" sx={{ 
                                color: row.pnl >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 'bold',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                ${row.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                    ))}
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary', borderBottom: 'none' }}>
                                No trades yet
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TopSymbolsList;
