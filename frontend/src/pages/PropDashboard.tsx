import { Box, Typography, Paper, CircularProgress, Button, Grid, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, ReferenceLine } from 'recharts';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBaseUrl } from '../utils/config';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths } from 'date-fns';
import { CalendarMonth, Add, Warning, ShowChart, Security, Gavel, ChevronLeft, ChevronRight } from '@mui/icons-material';

const MotionPaper = motion(Paper);

const FloatingCard = ({ children, delay = 0, sx = {} }: { children: React.ReactNode, delay?: number, sx?: any }) => (
    <MotionPaper
        className="glass-effect"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
        whileHover={{ scale: 1.01, zIndex: 10, transition: { duration: 0.3, ease: 'easeOut' } }}
        sx={{ p: 3, borderRadius: 4, position: 'relative', overflow: 'hidden', height: '100%', ...sx }}
    >
        {children}
    </MotionPaper>
);

const PropDashboard = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [openSetup, setOpenSetup] = useState(false);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // Setup Form State
    const [firmName, setFirmName] = useState('The Funded Room');
    const [accountType, setAccountType] = useState('1_STEP');
    const [accountSize, setAccountSize] = useState(100000);
    const [status, setStatus] = useState('PHASE_1');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${getBaseUrl()}/api/prop-account/dashboard`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (res.ok && data) {
                setDashboardData(data);
            } else {
                setDashboardData(null);
            }
        } catch (error) {
            console.error("Failed to load prop dashboard data:", error);
            setDashboardData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const handleCreateAccount = async () => {
        try {
            await fetch(`${getBaseUrl()}/api/prop-account`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firmName, accountType, accountSize: Number(accountSize), status
                })
            });
            setOpenSetup(false);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you sure you want to delete this account? Wait, we'll implement this properly later.")) return;
        try {
            await fetch(`${getBaseUrl()}/api/prop-account/${dashboardData.account.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            setDashboardData(null);
        } catch (e) {
            console.error(e);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    // --- SETUP VIEW ---
    if (!dashboardData?.account) {
        return (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <MotionPaper
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    sx={{ p: 5, borderRadius: 4, textAlign: 'center', maxWidth: 500 }}
                    elevation={4}
                >
                    <Security sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h4" gutterBottom fontWeight="bold">Prop Firm Tracker</Typography>
                    <Typography color="text.secondary" mb={4}>
                        Track your daily drawdown, profit targets, and consistency rules automatically using your imported trades.
                    </Typography>
                    <Button variant="contained" size="large" onClick={() => setOpenSetup(true)} startIcon={<Add />} sx={{ borderRadius: 8, px: 4, py: 1.5 }}>
                        Setup New Account
                    </Button>
                </MotionPaper>

                <Dialog open={openSetup} onClose={() => setOpenSetup(false)} PaperProps={{ sx: { borderRadius: 4, minWidth: 400 } }}>
                    <DialogTitle>Setup Prop Account</DialogTitle>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField select label="Firm Name" value={firmName} onChange={(e) => setFirmName(e.target.value)} fullWidth>
                            <MenuItem value="The Funded Room">The Funded Room</MenuItem>
                        </TextField>
                        <TextField select label="Account Type" value={accountType} onChange={(e) => setAccountType(e.target.value)} fullWidth>
                            <MenuItem value="1_STEP">1-Step Evaluation</MenuItem>
                            <MenuItem value="2_STEP">2-Step Evaluation</MenuItem>
                            <MenuItem value="INSTANT">Instant Funding</MenuItem>
                        </TextField>
                        <TextField type="number" label="Account Size ($)" value={accountSize} onChange={(e) => setAccountSize(Number(e.target.value))} fullWidth />
                        <TextField select label="Current Status" value={status} onChange={(e) => setStatus(e.target.value)} fullWidth>
                            <MenuItem value="PHASE_1">Phase 1 (Evaluation)</MenuItem>
                            <MenuItem value="PHASE_2">Phase 2 (Evaluation)</MenuItem>
                            <MenuItem value="FUNDED">Funded / Master</MenuItem>
                        </TextField>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setOpenSetup(false)}>Cancel</Button>
                        <Button variant="contained" onClick={handleCreateAccount} sx={{ borderRadius: 4 }}>Save Account</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }

    const { account, metrics, rules, chartData, profitCalendar } = dashboardData;

    const renderProgressBar = (label: string, current: number, max: number, isGood: boolean, isCurrency: boolean = true) => {
        const pct = Math.min((current / max) * 100, 100);
        const nearLimit = pct > 0 && !isGood ? pct > 85 : false;

        // Define color based on status
        let barColor = isGood ? theme.palette.success.main : theme.palette.warning.main;
        if (nearLimit) barColor = theme.palette.error.main;

        return (
            <Box sx={{ mb: 3, width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight="bold" color={nearLimit ? 'error.main' : 'text.primary'}>
                        {isCurrency ? `$${current.toFixed(2)}` : current} / {isCurrency ? `$${max.toFixed(2)}` : max} ({pct.toFixed(1)}%)
                    </Typography>
                </Box>
                <Box sx={{ width: '100%', height: 12, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                    <Box
                        component={motion.div}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        sx={{
                            height: '100%',
                            bgcolor: pct > 0 ? (barColor || 'primary.main') : 'transparent',
                            borderRadius: 6,
                            boxShadow: pct > 0 ? `0 0 15px ${barColor || '#9c27b0'}66` : 'none',
                            minWidth: pct > 0 ? 10 : 0
                        }}
                    />
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {account.firmName}
                        <Chip label={account.accountType.replace('_', ' ')} color="primary" size="small" />
                        <Chip label={account.status.replace('_', ' ')} color="secondary" size="small" />
                    </Typography>
                    <Typography color="text.secondary" variant="h6">
                        ${account.accountSize.toLocaleString()} Account
                    </Typography>
                </Box>
                <Button variant="outlined" color="error" size="small" onClick={handleDeleteAccount} sx={{ borderRadius: 20 }}>
                    Reset / Delete
                </Button>
            </Box>

            <Grid container spacing={4} sx={{ width: '100%', m: 0, '--Grid-columns': 12 }}>
                {/* Row 1: Chart (Left, ~75%) and Rules (Right, ~25%) */}
                <Grid size={{ xs: 12, md: 8, lg: 9 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.2} sx={{ flexGrow: 1, minHeight: 450, width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" display="flex" alignItems="center"><ShowChart sx={{ mr: 1 }} /> Account Value Over Time</Typography>
                            <Typography variant="h5" fontWeight="bold" color={metrics.currentBalance >= account.accountSize ? 'success.main' : 'error.main'}>
                                ${metrics.currentBalance.toFixed(2)}
                            </Typography>
                        </Box>
                        <Box sx={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.2)" />
                                    <XAxis dataKey="date" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                    <YAxis domain={['auto', 'auto']} tickFormatter={(val) => `$${val}`} tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: 12, border: 'none', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(5px)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: '#9c27b0', fontWeight: 'bold' }}
                                        labelStyle={{ color: '#333' }}
                                    />
                                    <ReferenceLine y={account.accountSize} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#9c27b0"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 8, fill: '#fff', stroke: '#9c27b0', strokeWidth: 4 }}
                                        animationDuration={1500}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </FloatingCard>
                </Grid>

                <Grid size={{ xs: 12, md: 4, lg: 3 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.1} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography variant="h6" mb={4} display="flex" alignItems="center"><Gavel sx={{ mr: 1 }} /> Rules & Objectives</Typography>

                        <Box sx={{ flex: 1 }}>
                            {renderProgressBar("Daily Drawdown (Resets 2AM UTC)", rules.dailyDrawdown.current, rules.dailyDrawdown.limit, false)}
                            {renderProgressBar("Max Total Drawdown", rules.maxDrawdown.current, rules.maxDrawdown.limit, false)}

                            {rules.profitTarget.isActive && (
                                renderProgressBar("Profit Target", rules.profitTarget.current, rules.profitTarget.limit, true)
                            )}

                            {renderProgressBar("Minimum Trading Days", rules.minDays.current, rules.minDays.limit, true, false)}

                            {rules.consistency.isActive && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(156, 39, 176, 0.1)', borderRadius: 2, border: '1px solid rgba(156, 39, 176, 0.3)' }}>
                                    <Typography variant="caption" color="secondary.main" display="flex" alignItems="center" fontWeight="bold">
                                        <Warning sx={{ fontSize: 16, mr: 0.5 }} /> Consistency Rule (Max 15%)
                                    </Typography>
                                    <Typography variant="h6" sx={{ mt: 1, color: rules.consistency.currentPct > 15 ? 'error.main' : 'text.primary' }}>
                                        Current Best Day: {rules.consistency.currentPct.toFixed(1)}% of total profits
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </FloatingCard>
                </Grid>

                {/* Row 2: Monthly Calendar (Left, ~75%) and Stats (Right, ~25%) */}
                <Grid size={{ xs: 12, md: 8, lg: 9 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.3} sx={{ flexGrow: 1, width: '100%' }}>
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
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <Box key={day} sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 'bold', mb: 1 }}>
                                    {day}
                                </Box>
                            ))}

                            {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                                <Box key={`empty-` + i} />
                            ))}

                            {eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }).map((day, i) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const tradeStats = profitCalendar.find((p: any) => p.date === dateStr);
                                const hasTrades = !!tradeStats;
                                const pnl = tradeStats ? tradeStats.pnl : 0;
                                const isPositive = pnl > 0;

                                return (
                                    <Box key={i}>
                                        <motion.div
                                            whileHover={hasTrades ? { scale: 1.04, y: -4, zIndex: 10, transition: { duration: 0.2, ease: "easeOut" } } : {}}
                                            style={{ position: 'relative' }}
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
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
                                                        {isPositive ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                                                    </Typography>
                                                )}
                                            </Paper>
                                        </motion.div>
                                    </Box>
                                );
                            })}
                        </Box>
                    </FloatingCard>
                </Grid>

                <Grid size={{ xs: 12, md: 4, lg: 3 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.4} sx={{ flexGrow: 1, width: '100%' }}>
                        <Typography variant="h6" display="flex" alignItems="center" mb={3}>Portfolio Metrics</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                            <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderLeft: '4px solid #4caf50' }}>
                                <Typography variant="caption" color="text.secondary">Win Rate</Typography>
                                <Typography variant="h4" color="success.main" fontWeight="bold">{metrics.winRate}</Typography>
                            </Paper>
                            <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: 'background.paper' }}>
                                <Typography variant="caption" color="text.secondary">Win Days</Typography>
                                <Typography variant="h5" color="success.main">{metrics.totalWinDays}</Typography>
                            </Paper>
                            <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: 'background.paper' }}>
                                <Typography variant="caption" color="text.secondary">Loss Days</Typography>
                                <Typography variant="h5" color="error.main">{metrics.totalLossDays}</Typography>
                            </Paper>
                            <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: 'background.paper' }}>
                                <Typography variant="caption" color="text.secondary">Net P&L</Typography>
                                <Typography variant="h5" fontWeight="bold" color={metrics.totalPnl >= 0 ? "success.main" : "error.main"}>
                                    {metrics.totalPnl >= 0 ? '+' : ''}${Math.abs(metrics.totalPnl).toFixed(2)}
                                </Typography>
                            </Paper>
                        </Box>
                    </FloatingCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PropDashboard;
