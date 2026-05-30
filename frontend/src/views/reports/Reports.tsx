import { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useAllTrades, usePropAccounts } from '../../hooks/useTradeQueries';
import TradeItem from '../../components/common/TradeItem';

type SortKey = 'Date' | 'PnL' | 'Lots' | 'Duration';
type SortOrder = 'asc' | 'desc';

const Reports = () => {
    const { data: trades = [], isLoading: tradesLoading } = useAllTrades();
    const { data: propAccounts = [], isLoading: accountsLoading } = usePropAccounts();
    
    const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
    const [sortKey, setSortKey] = useState<SortKey>('Date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    useEffect(() => {
        if (propAccounts.length > 0 && selectedAccountId === 'ALL') {
             // You can explicitly default to 'ALL'
        }
    }, [propAccounts]);

    const sortedTrades = useMemo(() => {
        if (!trades) return [];
        
        let filteredTrades = trades;
        if (selectedAccountId !== 'ALL') {
            filteredTrades = trades.filter(t => t.propAccountId === selectedAccountId);
        }

        return [...filteredTrades].sort((a, b) => {
            let valA: number = 0;
            let valB: number = 0;

            if (sortKey === 'Date') {
                valA = new Date(a.openedAt).getTime();
                valB = new Date(b.openedAt).getTime();
            } else if (sortKey === 'PnL') {
                valA = a.pnl;
                valB = b.pnl;
            } else if (sortKey === 'Lots') {
                valA = parseFloat(a.volume);
                valB = parseFloat(b.volume);
            } else if (sortKey === 'Duration') {
                valA = new Date(a.closedAt).getTime() - new Date(a.openedAt).getTime();
                valB = new Date(b.closedAt).getTime() - new Date(b.openedAt).getTime();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [trades, sortKey, sortOrder]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc'); // Default to descending for new sort
        }
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortKey !== column) return null;
        return sortOrder === 'asc' ? <ArrowUpward sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} /> : <ArrowDownward sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />;
    };

    if (tradesLoading || accountsLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="reports-page">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Trade Reports</Typography>
                
                {propAccounts.length > 0 && (
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel id="account-select-label">Platform / Account</InputLabel>
                        <Select
                            labelId="account-select-label"
                            value={selectedAccountId}
                            label="Platform / Account"
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            sx={{ borderRadius: '15px' }}
                        >
                            <MenuItem value="ALL">All Platforms</MenuItem>
                            {propAccounts.map(acc => (
                                <MenuItem key={acc.id} value={acc.id}>
                                    {acc.firmName} ({acc.accountType.replace('_', ' ')})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Box>

            {sortedTrades.length === 0 ? (
                <Paper className="glass-effect" sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">No trades found. Go to Import to add your data.</Typography>
                </Paper>
            ) : (
                <Paper className="glass-effect" sx={{ p: { xs: 2, sm: 4 }, borderRadius: '30px' }}>
                    <Box className="report-header-row" sx={{ display: { xs: 'none', md: 'flex' }, px: 2.5, mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ flex: 1.2, fontWeight: 'bold', color: 'text.secondary' }}>Symbol</Typography>
                        
                        <Typography 
                            variant="subtitle2" 
                            sx={{ flex: 0.8, fontWeight: 'bold', color: 'text.secondary', cursor: 'pointer' }}
                            onClick={() => handleSort('Lots')}
                        >
                            Vol(Lots) <SortIcon column="Lots" />
                        </Typography>
                        
                        <Typography variant="subtitle2" sx={{ flex: 1.5, fontWeight: 'bold', color: 'text.secondary' }}>Entry / Close</Typography>
                        
                        <Typography 
                            variant="subtitle2" 
                            sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary', cursor: 'pointer' }}
                            onClick={() => handleSort('PnL')}
                        >
                            PnL <SortIcon column="PnL" />
                        </Typography>
                        
                        <Typography 
                            variant="subtitle2" 
                            sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary', cursor: 'pointer' }}
                            onClick={() => handleSort('Duration')}
                        >
                            Duration <SortIcon column="Duration" />
                        </Typography>
                        
                        <Typography 
                            variant="subtitle2" 
                            sx={{ flex: 1.5, fontWeight: 'bold', color: 'text.secondary', textAlign: 'right', cursor: 'pointer' }}
                            onClick={() => handleSort('Date')}
                        >
                            Date <SortIcon column="Date" />
                        </Typography>
                    </Box>

                    <Box className="report-trade-list">
                        {sortedTrades.map((row, index) => (
                            <TradeItem key={row.id} trade={row} index={index} />
                        ))}
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default Reports;
