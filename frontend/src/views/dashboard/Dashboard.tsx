import { Box, Typography, Paper, CircularProgress, IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths } from 'date-fns';
import { ShowChart, CalendarMonth, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useDashboardStats, useTrades } from '../../hooks/useTradeQueries';

const MotionPaper = motion(Paper);

const FloatingCard = ({ children, delay = 0 }: { children: ReactNode, delay?: number }) => (
    <MotionPaper
        className="glass-effect"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
        whileHover={{ scale: 1.01, zIndex: 10, transition: { duration: 0.3, ease: 'easeOut' } }}
        sx={{ 
            p: { xs: 2.5, sm: 4, md: 5 }, 
            borderRadius: { xs: '30px', md: '40px' }, 
            position: 'relative', 
            overflow: 'hidden', 
            height: '100%' 
        }}
    >
        {children}
    </MotionPaper>
);

const CustomDot = (props: Record<string, unknown>) => {
    const { cx, cy, index } = props as { cx: number; cy: number; index: number };
    return (
        <motion.circle
            cx={cx}
            cy={cy}
            r={6}
            fill="#2196f3"
            stroke="#fff"
            strokeWidth={2}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.6, ease: "easeOut" }}
            style={{ filter: 'drop-shadow(0 0 8px rgba(33, 150, 243, 0.8))' }}
        />
    );
};

const Dashboard = () => {
    const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedBroker, setSelectedBroker] = useState<string>('vantage');

    const { data: stats, isLoading: isLoadingStats } = useDashboardStats(selectedBroker);
    const { data: trades = [], isLoading: isLoadingTrades } = useTrades(selectedBroker);

    const isLoading = isLoadingStats || isLoadingTrades;

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    const chartData = stats?.chartData || [];
    const quickStats = stats?.quickStats || { total: 0, winRate: '0%', largestLoss: '$0.00' };

    const calendarMap: { [key: string]: { pnl: number, count: number } } = {};
    if (trades && trades.length > 0) {
        trades.forEach((t) => {
            const dateStr = format(new Date(t.openedAt), 'yyyy-MM-dd');
            if (!calendarMap[dateStr]) calendarMap[dateStr] = { pnl: 0, count: 0 };
            calendarMap[dateStr].pnl += t.pnl;
            calendarMap[dateStr].count += 1;
        });
    }

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const latestTotalPnl = chartData.length > 0 ? chartData[chartData.length - 1].pnl : 0;
    const isTotalPositive = latestTotalPnl >= 0;

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
                    <ToggleButton value="vantage">Vantage</ToggleButton>
                    <ToggleButton value="the_funded_room">The Funded Room</ToggleButton>
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
                        {chartData.length === 0 ? (
                            <Box className="chart-empty">
                                <Typography color="text.secondary">No chart data available. Go to Import to upload trades.</Typography>
                            </Box>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.2)" />
                                    <XAxis dataKey="date" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={(val) => `$${val}`} tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: 'none', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(5px)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: '#2196f3', fontWeight: 'bold' }}
                                        labelStyle={{ color: '#333' }}
                                    />
                                    <Line
                                        type="monotone" dataKey="pnl" stroke="#2196f3" strokeWidth={4}
                                        dot={<CustomDot />}
                                        activeDot={{ r: 8, fill: '#fff', stroke: '#2196f3', strokeWidth: 7 }}
                                        animationDuration={2000} animationEasing="ease-out"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                </FloatingCard>
            </Box>

            <Box className="stats-section">
                <Box sx={{ flex: '1 1 60%', minWidth: 300 }}>
                    <FloatingCard delay={0.3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarMonth sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h5">Monthly Calendar ({format(currentDate, 'MMMM yyyy')})</Typography>
                            </Box>
                            <Box>
                                <IconButton onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                                    <ChevronLeft />
                                </IconButton>
                                <IconButton onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                                    <ChevronRight />
                                </IconButton>
                            </Box>
                        </Box>
                        <Box className="calendar-grid">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <Box key={day} className="calendar-day-header" sx={{ color: 'text.secondary' }}>
                                    {day}
                                </Box>
                            ))}
                            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                                <Box key={`empty-${i}`} />
                            ))}
                            {daysInMonth.map((day, i) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const tradeStats = calendarMap[dateStr];
                                const hasTrades = !!tradeStats;
                                const pnl = tradeStats ? tradeStats.pnl : 0;
                                const isPositive = pnl > 0;

                                return (
                                    <Box key={i}>
                                        <motion.div
                                            whileHover={hasTrades ? { scale: 1.04, y: -4, zIndex: 10, transition: { duration: 0.2, ease: "easeOut" } } : {}}
                                            style={{ position: 'relative' }}
                                            onHoverStart={() => setHoveredDay(day)}
                                            onHoverEnd={() => setHoveredDay(null)}
                                        >
                                            <Paper
                                                elevation={hasTrades ? 4 : 1}
                                                className={`calendar-day ${hasTrades ? 'calendar-day--has-trades' : 'calendar-day--no-trades'}`}
                                                sx={{
                                                    backgroundColor: hasTrades
                                                        ? (isPositive ? 'success.main' : 'error.main')
                                                        : 'background.paper',
                                                    color: hasTrades ? 'white' : 'text.disabled',
                                                    borderColor: hasTrades ? (isPositive ? 'success.dark' : 'error.dark') : 'divider',
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                    {format(day, 'MMM d')}
                                                </Typography>
                                                {hasTrades && (
                                                    <Box>
                                                        <Typography 
                                                    sx={{ 
                                                        fontWeight: 'bold',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    {isPositive ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                                                </Typography>
                                                        <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.65rem', display: 'block', mt: -0.2 }}>
                                                            {tradeStats.count} Trades
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Paper>

                                            {hasTrades && hoveredDay === day && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                                    animate={{ opacity: 1, y: -10, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                                    className={`hover-bubble ${isPositive ? 'hover-bubble--positive' : 'hover-bubble--negative'}`}
                                                >
                                                    {isPositive ? '+' : '-'}${Math.abs(pnl).toFixed(2)} Net PnL ({tradeStats.count} Trades)
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    </Box>
                                );
                            })}
                        </Box>
                    </FloatingCard>
                </Box>

                <Box sx={{ flex: '1 1 30%', minWidth: 300 }}>
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
