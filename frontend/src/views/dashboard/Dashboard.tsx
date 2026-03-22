import { Box, Typography, Paper, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { motion } from 'framer-motion';
import { ShowChart } from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useDashboardStats, useTrades } from '../../hooks/useTradeQueries';
import { BROKERS } from '../../constants/common';
import { formatCalendarData } from '../../utils/tradeUtils';

import FloatingCard from '../../components/common/FloatingCard';
import ProfitCalendar from '../../components/common/ProfitCalendar';
import EquityChart from '../../components/charts/EquityChart';

const Dashboard = () => {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedBroker, setSelectedBroker] = useState<string>(BROKERS.THE_FUNDED_ROOM);

    const { data: stats, isLoading: isLoadingStats } = useDashboardStats(selectedBroker);
    const { data: trades = [], isLoading: isLoadingTrades } = useTrades(selectedBroker);

    const chartData = stats?.chartData || [];
    const quickStats = stats?.quickStats || { total: 0, winRate: '0%', largestLoss: '$0.00' };

    const calendarData = useMemo(() => formatCalendarData(trades), [trades]);

    const latestTotalPnl = chartData.length > 0 ? chartData[chartData.length - 1].pnl : 0;
    const isTotalPositive = latestTotalPnl >= 0;
    const isLoading = isLoadingStats || isLoadingTrades;

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
    }

    return (
        <Box className="dashboard-page">
            {/* Broker Selector */}
            <Box className="broker-selector">
                <ToggleButtonGroup
                    value={selectedBroker}
                    exclusive
                    onChange={(_, val) => val && setSelectedBroker(val)}
                    aria-label="broker selector"
                    sx={{
                        backgroundColor: 'background.paper',
                        borderRadius: '30px',
                        p: 0.5,
                        '& .MuiToggleButton-root': {
                            border: 'none',
                            borderRadius: '25px !important',
                            px: 4,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                            color: 'text.secondary',
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' }
                            }
                        }
                    }}
                >
                    <ToggleButton value={BROKERS.VANTAGE}>Vantage</ToggleButton>
                    <ToggleButton value={BROKERS.THE_FUNDED_ROOM}>The Funded Room</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Box sx={{ width: '100%' }}>
                <FloatingCard delay={0.1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                            <ShowChart sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
                            Cumulative PnL
                        </Typography>
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                        >
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 'bold',
                                    backgroundColor: isTotalPositive ? 'success.light' : 'error.light',
                                    color: isTotalPositive ? 'success.dark' : 'error.dark',
                                    px: 2, py: 1, borderRadius: '30px'
                                }}
                            >
                                {isTotalPositive ? '+' : ''}${latestTotalPnl.toFixed(2)}
                            </Typography>
                        </motion.div>
                    </Box>
                    <Box className="chart-container">
                        <EquityChart
                            data={chartData}
                            dataKey="pnl"
                            showDots={true}
                        />
                    </Box>
                </FloatingCard>
            </Box>

            <Box className="stats-section">
                <Box sx={{ flex: '1 1 60%', minWidth: 300 }}>
                    <FloatingCard delay={0.3}>
                        <ProfitCalendar
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            data={calendarData}
                            title="Monthly P&L"
                        />
                    </FloatingCard>
                </Box>

                <Box sx={{ flex: '1 1 10%', minWidth: 300 }}>
                    <FloatingCard delay={0.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5">Quick Stats</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Paper className="stat-card" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', borderLeft: '4px solid #2196f3' }}>
                                <Typography variant="caption" color="text.secondary">Total Trades</Typography>
                                <Typography variant="h4" color="primary.main">{quickStats.total}</Typography>
                            </Paper>
                            <Paper className="stat-card" sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', borderLeft: '4px solid #4caf50' }}>
                                <Typography variant="caption" color="text.secondary">Win Rate</Typography>
                                <Typography variant="h4" color="success.main">{quickStats.winRate}</Typography>
                            </Paper>
                            <Paper className="stat-card" sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', borderLeft: '4px solid #f44336' }}>
                                <Typography variant="caption" color="text.secondary">Largest Loss</Typography>
                                <Typography variant="h4" color="error.main">{quickStats.largestLoss}</Typography>
                            </Paper>
                        </Box>
                    </FloatingCard>
                </Box>
            </Box>
        </Box>
    );
};

export default Dashboard;
