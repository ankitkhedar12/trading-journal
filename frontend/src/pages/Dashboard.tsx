import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ShowChart, CalendarMonth } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

const MotionPaper = motion(Paper);

const FloatingCard = ({ children, delay = 0 }: { children: ReactNode, delay?: number }) => (
    <MotionPaper
        className="glass-effect"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 12, delay }}
        whileHover={{ scale: 1.01, zIndex: 10 }}
        sx={{ p: 3, borderRadius: 4, position: 'relative', overflow: 'hidden', height: '100%' }}
    >
        {children}
    </MotionPaper>
);

const CustomDot = (props: any) => {
    const { cx, cy, index } = props;
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
            transition={{ delay: 0.5 + index * 0.1, duration: 0.5, type: "spring" }}
            style={{ filter: 'drop-shadow(0 0 8px rgba(33, 150, 243, 0.8))' }}
        />
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [trades, setTrades] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const resStats = await fetch('http://localhost:3000/api/trades/dashboard', {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                const dataStats = await resStats.json();
                setStats(dataStats);

                // Also fetch trades to build out the correct calendar
                const resTrades = await fetch('http://localhost:3000/api/trades', {
                    headers: { 'Authorization': `Bearer ${user?.token}` }
                });
                const dataTrades = await resTrades.json();
                setTrades(dataTrades);

            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) fetchDashboardData();
    }, [user]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    const chartData = stats?.chartData || [];
    const quickStats = stats?.quickStats || { total: 0, winRate: '0%', largestLoss: '$0.00' };

    // Group current calendar trades by Date string for mapping
    const calendarMap: { [key: string]: { pnl: number, count: number } } = {};
    if (trades && trades.length > 0) {
        trades.forEach(t => {
            const dateStr = format(new Date(t.openedAt), 'yyyy-MM-dd');
            if (!calendarMap[dateStr]) calendarMap[dateStr] = { pnl: 0, count: 0 };
            calendarMap[dateStr].pnl += t.pnl;
            calendarMap[dateStr].count += 1;
        });
    }

    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const latestTotalPnl = chartData.length > 0 ? chartData[chartData.length - 1].pnl : 0;
    const isTotalPositive = latestTotalPnl >= 0;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box sx={{ width: '100%' }}>
                <FloatingCard delay={0.1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
                            <ShowChart sx={{ mr: 1, color: 'primary.main' }} />
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
                                    px: 2,
                                    py: 1,
                                    borderRadius: 2
                                }}
                            >
                                {isTotalPositive ? '+' : ''}${latestTotalPnl.toFixed(2)}
                            </Typography>
                        </motion.div>
                    </Box>
                    <Box sx={{ height: 400, width: '100%' }}>
                        {chartData.length === 0 ? (
                            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="pnl"
                                        stroke="#2196f3"
                                        strokeWidth={4}
                                        dot={<CustomDot />}
                                        activeDot={{ r: 8, fill: '#fff', stroke: '#2196f3', strokeWidth: 3 }}
                                        animationDuration={2000}
                                        animationEasing="ease-out"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                </FloatingCard>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                <Box sx={{ flex: '1 1 60%', minWidth: 300 }}>
                    <FloatingCard delay={0.3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <CalendarMonth sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h5">Monthly Calendar ({format(today, 'MMMM')})</Typography>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <Box key={day} sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 'bold', mb: 1 }}>
                                    {day}
                                </Box>
                            ))}

                            {/* Empty boxes for offset */}
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
                                            whileHover={hasTrades ? { scale: 1.1, rotate: Math.random() * 6 - 3, zIndex: 10 } : {}}
                                            style={{ position: 'relative' }}
                                            onHoverStart={() => setHoveredDay(day)}
                                            onHoverEnd={() => setHoveredDay(null)}
                                        >
                                            <Paper
                                                elevation={hasTrades ? 4 : 1}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    height: 80,
                                                    backgroundColor: hasTrades
                                                        ? (isPositive ? 'success.main' : 'error.main')
                                                        : 'background.paper',
                                                    color: hasTrades ? 'white' : 'text.disabled',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    cursor: hasTrades ? 'pointer' : 'default',
                                                    border: '1px solid',
                                                    borderColor: hasTrades ? (isPositive ? 'success.dark' : 'error.dark') : 'divider',
                                                    opacity: hasTrades ? 1 : 0.6
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                    {format(day, 'MMM d')}
                                                </Typography>
                                                {hasTrades && (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontWeight: 'bold', color: 'white' }}
                                                    >
                                                        {isPositive ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                                                    </Typography>
                                                )}
                                            </Paper>

                                            {/* Floating Summary Bubble */}
                                            {hasTrades && hoveredDay === day && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                                    animate={{ opacity: 1, y: -10, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: '100%',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        backgroundColor: isPositive ? '#4caf50' : '#f44336',
                                                        color: 'white',
                                                        padding: '8px 16px',
                                                        borderRadius: 20,
                                                        fontWeight: 'bold',
                                                        whiteSpace: 'nowrap',
                                                        boxShadow: `0 4px 15px ${isPositive ? 'rgba(76,175,80,0.4)' : 'rgba(244,67,54,0.4)'}`,
                                                        zIndex: 20
                                                    }}
                                                >
                                                    {isPositive ? '+' : '-'}${Math.abs(pnl).toFixed(2)} Net PnL ({tradeStats.count} Trades)
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        border: '6px solid transparent',
                                                        borderTopColor: isPositive ? '#4caf50' : '#f44336'
                                                    }} />
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
                            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderLeft: '4px solid #2196f3' }}>
                                <Typography variant="caption" color="text.secondary">Total Trades</Typography>
                                <Typography variant="h4" color="primary.main">{quickStats.total}</Typography>
                            </Paper>
                            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderLeft: '4px solid #4caf50' }}>
                                <Typography variant="caption" color="text.secondary">Win Rate</Typography>
                                <Typography variant="h4" color="success.main">{quickStats.winRate}</Typography>
                            </Paper>
                            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', borderLeft: '4px solid #f44336' }}>
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
