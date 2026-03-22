import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useAllTrades } from '../../hooks/useTradeQueries';
import TradeItem from '../../components/common/TradeItem';
import type { Trade } from '../../types/trade';

const Reports = () => {
    const { data: trades = [], isLoading } = useAllTrades();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="reports-page">
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Trade Reports</Typography>

            {trades.length === 0 ? (
                <Paper className="glass-effect" sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">No trades found. Go to Import to add your data.</Typography>
                </Paper>
            ) : (
                <Paper className="glass-effect" sx={{ p: { xs: 2, sm: 4 }, borderRadius: '30px' }}>
                    <Box className="report-header-row" sx={{ display: { xs: 'none', md: 'flex' }, px: 2.5, mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ flex: 1.2, fontWeight: 'bold', color: 'text.secondary' }}>Symbol</Typography>
                        <Typography variant="subtitle2" sx={{ flex: 0.8, fontWeight: 'bold', color: 'text.secondary' }}>Vol(Lots)</Typography>
                        <Typography variant="subtitle2" sx={{ flex: 1.5, fontWeight: 'bold', color: 'text.secondary' }}>Entry / Close</Typography>
                        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary' }}>PnL</Typography>
                        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary' }}>Duration</Typography>
                        <Typography variant="subtitle2" sx={{ flex: 1.5, fontWeight: 'bold', color: 'text.secondary', textAlign: 'right' }}>Date</Typography>
                    </Box>

                    <Box className="report-trade-list">
                        {(trades as Trade[]).map((row, index) => (
                            <TradeItem key={row.id} trade={row} index={index} />
                        ))}
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default Reports;
