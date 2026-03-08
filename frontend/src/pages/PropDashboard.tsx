import { Box, Typography, Paper, CircularProgress, Button, Grid, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton, useTheme, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
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
        sx={{ p: 3, borderRadius: '30px', position: 'relative', overflow: 'hidden', height: '100%', ...sx }}
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
    const [openEdit, setOpenEdit] = useState(false);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // Form State
    const [firmName, setFirmName] = useState('The Funded Room');
    const [accountType, setAccountType] = useState('1_STEP');
    const [accountSize, setAccountSize] = useState(100000);
    const [status, setStatus] = useState('PHASE_1');

    useEffect(() => {
        if (!dashboardData?.account) {
            const defaultStatus = accountType === 'INSTANT' ? 'FUNDED' : 'PHASE_1';
            if (status !== defaultStatus && status !== 'FAILED') {
                setStatus(defaultStatus);
            }
        }
    }, [accountType, dashboardData?.account]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${getBaseUrl()}/api/prop-account/dashboard`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (res.ok && data) {
                setDashboardData(data);
                // Pre-fill edit form
                if (data.account) {
                    setFirmName(data.account.firmName);
                    setAccountType(data.account.accountType);
                    setAccountSize(data.account.accountSize);
                    setStatus(data.account.status);
                }
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
                headers: { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ firmName, accountType, accountSize: Number(accountSize), status })
            });
            setOpenSetup(false);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateAccount = async () => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/prop-account/${dashboardData.account.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user?.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ firmName, accountType, accountSize: Number(accountSize), status })
            });
            if (res.ok) {
                setOpenEdit(false);
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you sure you want to delete this account? This will remove all tracking for this prop firm.")) return;
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
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
    }

    // --- SETUP VIEW ---
    if (!dashboardData?.account) {
        return (
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <MotionPaper initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} sx={{ p: 5, borderRadius: '30px', textAlign: 'center', maxWidth: 500 }} elevation={4} >
                    <Security sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h4" gutterBottom fontWeight="bold">Prop Firm Tracker</Typography>
                    <Typography color="text.secondary" mb={4}>
                        Track your daily drawdown, profit targets, and consistency rules automatically using your imported trades.
                    </Typography>
                    <Button variant="contained" size="large" onClick={() => setOpenSetup(true)} startIcon={<Add />} sx={{ borderRadius: '10px !important', px: 4, py: 1.5 }}>
                        Setup New Account
                    </Button>
                </MotionPaper>

                <Dialog open={openSetup} onClose={() => setOpenSetup(false)} PaperProps={{ sx: { borderRadius: '15px', minWidth: 400 } }}>
                    <DialogTitle>Setup Prop Account</DialogTitle>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField select label="Firm Name" value={firmName} onChange={(e) => setFirmName(e.target.value)} fullWidth>
                            <MenuItem value="The Funded Room">The Funded Room</MenuItem>
                            <MenuItem value="FTMO">FTMO</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                        </TextField>
                        <TextField select label="Account Type" value={accountType} onChange={(e) => setAccountType(e.target.value)} fullWidth sx={{ mt: 1 }}>
                            <MenuItem value="1_STEP">1-Step Evaluation</MenuItem>
                            <MenuItem value="2_STEP">2-Step Evaluation</MenuItem>
                            <MenuItem value="INSTANT">Instant Funding</MenuItem>
                        </TextField>
                        <TextField type="number" label="Account Size ($)" value={accountSize} onChange={(e) => setAccountSize(Number(e.target.value))} fullWidth sx={{ mt: 1 }} />
                        <TextField 
                            select 
                            label="Current Status" 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)} 
                            fullWidth 
                            sx={{ mt: 1 }}
                        >
                            {accountType !== 'INSTANT' && <MenuItem value="PHASE_1">Phase 1 (Evaluation)</MenuItem>}
                            {accountType === '2_STEP' && <MenuItem value="PHASE_2">Phase 2 (Evaluation)</MenuItem>}
                            <MenuItem value="FUNDED">Funded / Master</MenuItem>
                            <MenuItem value="FAILED" sx={{ color: 'error.main' }}>FAILED (Account Revoked)</MenuItem>
                        </TextField>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setOpenSetup(false)}>Cancel</Button>
                        <Button variant="contained" onClick={handleCreateAccount} sx={{ borderRadius: '10px !important' }}>Save Account</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }

    const { account, metrics, rules, chartData, profitCalendar, violationMessage } = dashboardData;
    const isFailed = account.status === 'FAILED';

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    let totalTradesThisMonth = 0;
    daysInMonth.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const tradeStats = profitCalendar?.find((p: any) => p.date === dateStr);
        if (tradeStats) totalTradesThisMonth += tradeStats.tradesCount;
    });

    const renderProgressBar = (label: string, current: number, max: number, isGood: boolean, isCurrency: boolean = true) => {
        const pct = Math.min((current / max) * 100, 100);
        const nearLimit = pct > 0 && !isGood ? pct > 85 : false;
        let barColor = isGood ? theme.palette.success.main : theme.palette.warning.main;
        if (nearLimit || (pct >= 100 && !isGood)) barColor = theme.palette.error.main;

        return (
            <Box sx={{ mb: 3, width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight="bold" color={nearLimit ? 'error.main' : 'text.primary'}>
                        {isCurrency ? `$${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : current} / {isCurrency ? `$${max.toLocaleString()}` : max} ({pct.toFixed(1)}%)
                    </Typography>
                </Box>
                <Box sx={{ width: '100%', height: 12, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                    <Box component={motion.div} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
                        sx={{ height: '100%', bgcolor: pct > 0 ? (barColor || 'primary.main') : 'transparent', borderRadius: 6, boxShadow: pct > 0 ? `0 0 15px ${barColor || '#9c27b0'}66` : 'none', minWidth: pct > 0 ? 10 : 0 }}
                    />
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Violation Alerts */}
            <AnimatePresence>
                {(isFailed || violationMessage) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <Alert severity="error" variant="filled" sx={{ borderRadius: '30px', mb: 2, fontWeight: 'bold', fontSize: '1.1rem' }} action={<Button color="inherit" size="small" onClick={() => setOpenEdit(true)}>FIX / OVERRIDE</Button>}>
                            ACCOUNT FAILED: {violationMessage || "A rule has been violated. The account is marked as Failed."}
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {account.firmName}
                        <Chip label={account.accountType.replace('_', ' ')} color="primary" size="small" variant="outlined" />
                        <Chip label={account.status.replace('_', ' ')} color={isFailed ? "error" : "success"} size="small" />
                    </Typography>
                    <Typography color="text.secondary" variant="h6">
                        ${account.accountSize.toLocaleString()} Account • {account.firmName}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" size="small" onClick={() => setOpenEdit(true)} sx={{ borderRadius: '10px !important' }}>Edit Account</Button>
                    <Button variant="outlined" color="error" size="small" onClick={handleDeleteAccount} sx={{ borderRadius: '10px !important' }}>Delete</Button>
                </Box>
            </Box>

            <Grid container spacing={4} sx={{ width: '100%', m: 0 }}>
                {/* Row 1: Chart and Rules */}
                <Grid size={{ xs: 12, lg: 9 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.2} sx={{ flexGrow: 1, minHeight: 450, width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" display="flex" alignItems="center"><ShowChart sx={{ mr: 1 }} /> Performance Curve</Typography>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h5" fontWeight="bold" color={metrics.currentBalance >= account.accountSize ? 'success.main' : 'error.main'}>
                                    ${metrics.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Equity</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                                    <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={['auto', 'auto']} tickFormatter={(val) => `$${val.toLocaleString()}`} tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '15px', border: 'none', background: theme.palette.mode === 'dark' ? '#1e293b' : '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                                        itemStyle={{ color: '#9c27b0', fontWeight: 'bold' }}
                                    />
                                    <ReferenceLine y={account.accountSize} stroke="rgba(150,150,150,0.4)" strokeDasharray="5 5" label={{ value: 'INITIAL', position: 'right', fill: '#888', fontSize: 10 }} />
                                    <Line type="monotone" dataKey="value" stroke="#9c27b0" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </FloatingCard>
                </Grid>

                <Grid size={{ xs: 12, lg: 3 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.1} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography variant="h6" mb={4} display="flex" alignItems="center"><Gavel sx={{ mr: 1 }} /> Objective Rules</Typography>
                        <Box sx={{ flex: 1 }}>
                            {renderProgressBar("Daily Drawdown (Static)", rules.dailyDrawdown.current, rules.dailyDrawdown.limit, false)}
                            {renderProgressBar("Max Total Drawdown", rules.maxDrawdown.current, rules.maxDrawdown.limit, false)}
                            {rules.profitTarget?.isActive && renderProgressBar("Profit Target", rules.profitTarget.current, rules.profitTarget.limit, true)}
                            {rules.minDays?.limit > 0 && renderProgressBar("Min Trading Days", rules.minDays.current, rules.minDays.limit, true, false)}
                            {rules.maxRisk?.isActive && renderProgressBar("Max 3% Aggregated Risk", rules.maxRisk.currentPct, 100, false, false)}

                            {rules.consistency?.isActive && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(156, 39, 176, 0.05)', borderRadius: '30px', border: '1px solid rgba(156, 39, 176, 0.2)' }}>
                                    <Typography variant="caption" color="secondary.main" display="flex" alignItems="center" fontWeight="bold">
                                        <Warning sx={{ fontSize: 16, mr: 0.5 }} /> Consistency Rule (15%)
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold', color: rules.consistency.currentPct > 15 ? 'error.main' : 'text.primary' }}>
                                        Best Day: {rules.consistency.currentPct.toFixed(1)}% of TP
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </FloatingCard>
                </Grid>

                {/* Calendar and Stats */}
                <Grid size={{ xs: 12, lg: 9 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.3} sx={{ flexGrow: 1, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarMonth sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h5">Trading Session Calendar</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton size="small" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft /></IconButton>
                                <Typography variant="body1" sx={{ minWidth: 120, textAlign: 'center', alignSelf: 'center' }}>{format(currentDate, 'MMMM yyyy')}</Typography>
                                <IconButton size="small" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight /></IconButton>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5 }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <Box key={day} sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 'bold', fontSize: '0.8rem', mb: 1 }}>{day}</Box>)}
                            {Array.from({ length: monthStart.getDay() }).map((_, i) => <Box key={`empty-${i}`} />)}
                            {daysInMonth.map((day, i) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const tradeStats = profitCalendar.find((p: any) => p.date === dateStr);
                                const hasTrades = !!tradeStats;
                                const pnl = tradeStats ? tradeStats.pnl : 0;
                                const count = tradeStats ? tradeStats.tradesCount : 0;
                                const isPositive = pnl > 0;
                                return (
                                    <Paper key={i} elevation={hasTrades ? 4 : 1} sx={{ p: 1.5, height: 80, borderRadius: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', bgcolor: hasTrades ? (isPositive ? 'success.main' : 'error.main') : 'background.paper', color: hasTrades ? 'white' : 'text.disabled', opacity: hasTrades ? 1 : 0.6, border: '1px solid', borderColor: hasTrades ? (isPositive ? 'success.dark' : 'error.dark') : 'divider', transition: 'all 0.2s', cursor: hasTrades ? 'pointer' : 'default', '&:hover': hasTrades ? { transform: 'scale(1.04) translateY(-4px)', zIndex: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' } : {} }}>
                                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{format(day, 'MMM d')}</Typography>
                                        {hasTrades && (
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
                                                    {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem', display: 'block' }}>
                                                    {count} Trades
                                                </Typography>
                                            </Box>
                                        )}
                                    </Paper>
                                );
                            })}
                        </Box>
                    </FloatingCard>
                </Grid>

                <Grid size={{ xs: 12, lg: 3 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.4} sx={{ flexGrow: 1, width: '100%' }}>
                        <Typography variant="h6" mb={3}>Account Matrix</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[
                                { label: 'Current P&L', val: `${metrics.totalPnl >= 0 ? '+' : ''}$${Math.abs(metrics.totalPnl).toFixed(2)}`, color: metrics.totalPnl >= 0 ? 'success.main' : 'error.main', bg: metrics.totalPnl >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' },
                                { label: `Trades (${format(currentDate, 'MMM')})`, val: totalTradesThisMonth, color: 'info.main', bg: 'rgba(33, 150, 243, 0.1)' },
                                { label: 'Win Rate', val: metrics.winRate, color: 'success.main', bg: 'rgba(76, 175, 80, 0.1)' },
                                { label: 'Win/Loss Days', val: `${metrics.totalWinDays}W / ${metrics.totalLossDays}L`, color: 'text.primary', bg: 'rgba(255, 255, 255, 0.03)' },
                                { label: 'Trading Days', val: metrics.tradingDays, color: 'primary.main', bg: 'rgba(156, 39, 176, 0.1)' },
                            ].map((stat, i) => (
                                <Paper key={i} sx={{ p: 2, borderRadius: '30px', bgcolor: stat.bg, border: 'none' }}>
                                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                                    <Typography variant="h5" color={stat.color} fontWeight="bold">{stat.val}</Typography>
                                </Paper>
                            ))}
                        </Box>
                    </FloatingCard>
                </Grid>
            </Grid>

            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} PaperProps={{ sx: { borderRadius: '30px', minWidth: 450 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Prop Account Settings</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', borderRadius: '15px', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                        <Typography variant="body2" color="error.main" fontWeight="bold" display="flex" alignItems="center">
                            <Warning sx={{ fontSize: 18, mr: 1 }} /> TRADE RESET WARNING
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Manually changing the account status will <strong>DELETE ALL TRADES</strong> associated with {account.firmName}. This action cannot be undone.
                        </Typography>
                    </Box>

                    <TextField select label="Firm Name" value={firmName} disabled fullWidth>
                        <MenuItem value={firmName}>{firmName}</MenuItem>
                    </TextField>
                    <TextField select label="Account Type" value={accountType} disabled fullWidth>
                        <MenuItem value={accountType}>{accountType.replace('_', ' ')}</MenuItem>
                    </TextField>
                    <TextField type="number" label="Starting Balance ($)" value={accountSize} disabled fullWidth />

                    <TextField 
                        select 
                        label="Update Status" 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)} 
                        fullWidth 
                        autoFocus
                    >
                        {accountType !== 'INSTANT' && <MenuItem value="PHASE_1">Phase 1 (Evaluation)</MenuItem>}
                        {accountType === '2_STEP' && <MenuItem value="PHASE_2">Phase 2 (Evaluation)</MenuItem>}
                        <MenuItem value="FUNDED">Funded / Master</MenuItem>
                        <MenuItem value="FAILED" sx={{ color: 'error.main' }}>FAILED (Account Revoked)</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleUpdateAccount} sx={{ borderRadius: '10px !important', px: 3 }}>Reset & Update Status</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PropDashboard;
