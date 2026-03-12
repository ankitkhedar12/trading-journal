import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useAllTrades } from '../../hooks/useTradeQueries';

interface TradeRow {
    id: string;
    symbol: string;
    volume: string;
    entryPrice: number;
    closePrice: number;
    pnl: number;
    openedAt: string;
}

const Reports = () => {
    const { data: trades = [], isLoading } = useAllTrades();

    const getPnlColor = (pnl: number) => {
        return pnl > 0 ? '#4caf50' : pnl < 0 ? '#f44336' : '#9e9e9eff';
    };

    const getPnlBg = (pnl: number) => {
        return pnl > 0 ? 'rgba(76, 175, 80, 0.05)' : pnl < 0 ? 'rgba(244, 67, 54, 0.05)' : 'rgba(158, 158, 158, 0.03)';
    };

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
                    <Box className="report-header-row" sx={{ display: { xs: 'none', md: 'flex' } }}>
                        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary' }}>Symbol</Typography>
                        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary' }}>Vol(Lots)</Typography>
                        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary' }}>Entry / Close</Typography>
                        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary' }}>PnL</Typography>
                        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary' }}>Date</Typography>
                    </Box>

                    <Box className="report-trade-list">
                        {(trades as TradeRow[]).map((row, index) => (
                            <motion.div
                                key={row.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
                            >
                                <Paper
                                    className="report-trade-row"
                                    sx={{
                                        bgcolor: getPnlBg(row.pnl),
                                        borderLeft: `4px solid ${getPnlColor(row.pnl)}`
                                    }}
                                >
                                    <Typography variant="body2" sx={{ flex: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                        <Box
                                            className="report-symbol-dot"
                                            sx={{ bgcolor: getPnlColor(row.pnl) }}
                                        >
                                            {row.symbol.charAt(0).toUpperCase()}
                                        </Box>
                                        {row.symbol}
                                    </Typography>
                                    <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>{row.volume}</Typography>
                                    <Typography variant="body2" sx={{ flex: 1, fontSize: '0.85rem', color: 'text.secondary' }}>
                                        {row.entryPrice} &rarr; {row.closePrice}
                                    </Typography>
                                    <Typography variant="body2" sx={{ flex: 1, fontWeight: 'bold', color: getPnlColor(row.pnl) }}>
                                        {row.pnl > 0 ? '+' : ''}{row.pnl.toFixed(2)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }}>
                                        {new Date(row.openedAt).toLocaleString()}
                                    </Typography>
                                </Paper>
                            </motion.div>
                        ))}
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default Reports;
