import { Box, Typography, CircularProgress, Button, Grid, Select, MenuItem } from '@mui/material';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContextType';
import { getBaseUrl } from '../../utils/config';
import { usePropDashboard, useInvalidateTrades, useAllTrades, usePropAccounts } from '../../hooks/useTradeQueries';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ShowChart } from '@mui/icons-material';
import { getSecureHeaders } from '../../utils/security';
import { formatCalendarData } from '../../utils/tradeUtils';
import { toast } from 'react-toastify';

import FloatingCard from '../../components/common/FloatingCard';
import ProfitCalendar from '../../components/common/ProfitCalendar';
import DayTradesModal from '../../components/common/DayTradesModal';
import AccountMatrix from '../funded/components/AccountMatrix';

import SetupVantageAccountDialog from './components/SetupVantageAccountDialog';
import EditVantageAccountDialog from './components/EditVantageAccountDialog';
import VantageSetupCenter from './components/VantageSetupCenter';
import WinRateGauge from './components/WinRateGauge';
import DrawdownCurve from './components/DrawdownCurve';
import TopSymbolsList from './components/TopSymbolsList';
import TimeAnalysisCharts from './components/TimeAnalysisCharts';
import YearlyPerformanceGrid from './components/YearlyPerformanceGrid';
import WeeklyWinRateChart from './components/WeeklyWinRateChart';
import WeeklyTradingFrequencyChart from './components/WeeklyTradingFrequencyChart';
import HourlyWinRateChart from './components/HourlyWinRateChart';
import HourlyTradingFrequencyChart from './components/HourlyTradingFrequencyChart';
import ProfitByMonthChart from './components/ProfitByMonthChart';
import EquityChart from '../../components/charts/EquityChart';

const Dashboard = () => {
    const { user } = useAuth();
    const invalidateTrades = useInvalidateTrades();
    const [openSetup, setOpenSetup] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // Vantage Setup / Edit State
    const [accountName, setAccountName] = useState<string>('');
    const [depositAmount, setDepositAmount] = useState<number>(10000);
    const [balanceAdjustment, setBalanceAdjustment] = useState<number>(0);

    // Day Selection State
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [showDayTrades, setShowDayTrades] = useState(false);

    // Account Selection State
    const { data: propAccounts = [], isLoading: isLoadingAccounts } = usePropAccounts();
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');

    // Filter to only Vantage accounts
    const vantageAccounts = useMemo(() => {
        return propAccounts.filter(acc => acc.firmName === 'Vantage');
    }, [propAccounts]);

    useEffect(() => {
        if (vantageAccounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(vantageAccounts[0].id);
        }
    }, [vantageAccounts, selectedAccountId]);

    const handleAccountChange = (accountId: string) => {
        setSelectedAccountId(accountId);
    };

    const { data: dashboardData = null, isLoading: isLoadingDashboard } = usePropDashboard(selectedAccountId, 'FUNDED');
    const { data: tradesList = [], isLoading: isLoadingTrades } = useAllTrades();

    // Pre-fill form when dashboard data loads
    useEffect(() => {
        if (dashboardData?.account) {
            setAccountName(dashboardData.account.accountType); // Vantage Account name is stored in accountType
            setDepositAmount(dashboardData.account.accountSize);
            setBalanceAdjustment(dashboardData.account.balanceAdjustment || 0);
        }
    }, [dashboardData]);

    const handleCreateAccount = async () => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/prop-account`, {
                method: 'POST',
                headers: getSecureHeaders(user?.token),
                body: JSON.stringify({
                    firmName: 'Vantage',
                    accountType: accountName,
                    accountSize: Number(depositAmount),
                    status: 'FUNDED',
                    hasHftWarning: false,
                    balanceAdjustment: 0
                })
            });
            if (res.ok) {
                const newAcc = await res.json();
                toast.success('Vantage account created successfully!');
                setOpenSetup(false);
                setAccountName('');
                setDepositAmount(10000);
                setSelectedAccountId(newAcc.id);
                invalidateTrades();
            } else {
                toast.error('Failed to create Vantage account.');
            }
        } catch {
            toast.error('Network error occurred.');
        }
    };

    const handleUpdateAccount = async () => {
        if (!dashboardData?.account?.id) return;
        try {
            const res = await fetch(`${getBaseUrl()}/api/prop-account/${dashboardData.account.id}`, {
                method: 'POST',
                headers: getSecureHeaders(user?.token),
                body: JSON.stringify({
                    firmName: 'Vantage',
                    accountType: accountName,
                    accountSize: Number(depositAmount),
                    status: 'FUNDED',
                    hasHftWarning: false,
                    balanceAdjustment: balanceAdjustment
                })
            });
            if (res.ok) {
                toast.success('Vantage account updated successfully!');
                setOpenEdit(false);
                invalidateTrades();
            } else {
                toast.error('Failed to update Vantage account.');
            }
        } catch {
            toast.error('Network error occurred.');
        }
    };

    const handleDeleteAccount = async () => {
        if (!dashboardData?.account?.id) return;
        if (!window.confirm("Are you sure you want to delete this Vantage account? This will remove all associated trades and settings.")) return;
        try {
            const res = await fetch(`${getBaseUrl()}/api/prop-account/${dashboardData.account.id}`, {
                method: 'DELETE',
                headers: getSecureHeaders(user?.token),
            });
            if (res.ok) {
                toast.success('Vantage account deleted successfully.');
                setSelectedAccountId('');
                invalidateTrades();
            } else {
                toast.error('Failed to delete Vantage account.');
            }
        } catch {
            toast.error('Network error occurred.');
        }
    };

    const calendarData = useMemo(() => {
        const filteredTrades = tradesList.filter(t => t.propAccountId === selectedAccountId);
        return formatCalendarData(filteredTrades);
    }, [tradesList, selectedAccountId]);

    const monthStart = startOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentDate) });
    let totalTradesThisMonth = 0;
    daysInMonth.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const tradeStats = calendarData[dateStr];
        if (tradeStats) totalTradesThisMonth += tradeStats.count;
    });

    const handleDayClick = (date: Date) => {
        setSelectedDay(date);
        setShowDayTrades(true);
    };

    const isLoading = isLoadingAccounts || isLoadingDashboard || isLoadingTrades;

    if (isLoading || (vantageAccounts.length > 0 && !dashboardData?.account)) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
    }

    // --- SETUP VIEW ---
    if (vantageAccounts.length === 0 || !dashboardData?.account) {
        return (
            <Box className="dashboard-page">
                <VantageSetupCenter
                    openSetup={openSetup}
                    setOpenSetup={setOpenSetup}
                    accountName={accountName}
                    setAccountName={setAccountName}
                    depositAmount={depositAmount}
                    setDepositAmount={setDepositAmount}
                    onCreate={handleCreateAccount}
                />
            </Box>
        );
    }

    const { account, metrics, chartData } = dashboardData;

    return (
        <Box className="dashboard-page" sx={{ gap: 2.5 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {account.accountType}
                    </Typography>
                    <Typography color="text.secondary" variant="h6">
                        ${account.accountSize.toLocaleString()} Account • Vantage
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" size="small" onClick={() => {
                        setAccountName('');
                        setDepositAmount(10000);
                        setOpenSetup(true);
                    }} sx={{ borderRadius: '10px !important' }}>+ New Account</Button>
                    <Button variant="outlined" size="small" onClick={() => setOpenEdit(true)} sx={{ borderRadius: '10px !important' }}>Edit Account</Button>
                    <Button variant="outlined" color="error" size="small" onClick={handleDeleteAccount} sx={{ borderRadius: '10px !important' }}>Delete</Button>
                </Box>
            </Box>

            {/* Account Selector */}
            {vantageAccounts.length > 0 && (
                <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
                    <Select
                        size="small"
                        value={selectedAccountId}
                        onChange={(e) => handleAccountChange(e.target.value as string)}
                        sx={{ borderRadius: '15px', minWidth: 200 }}
                    >
                        {vantageAccounts.map(acc => (
                            <MenuItem key={acc.id} value={acc.id}>
                                Vantage ({acc.accountType})
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
            )}

            <Grid container spacing={4}>
                {/* Row 1: Key Metrics Summary */}
                <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.1} sx={{ flexGrow: 1, p: 2 }}>
                        <Typography variant="body2" color="text.secondary">Net P&L</Typography>
                        <Typography variant="h5" fontWeight="bold" color={metrics.totalPnl >= 0 ? 'success.main' : 'error.main'}>
                            ${metrics.totalPnl.toFixed(2)}
                        </Typography>
                    </FloatingCard>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.2} sx={{ flexGrow: 1, p: 2 }}>
                        <Typography variant="body2" color="text.secondary">Win Rate</Typography>
                        <Typography variant="h5" fontWeight="bold" color="info.main">
                            {metrics.winRate}
                        </Typography>
                    </FloatingCard>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.3} sx={{ flexGrow: 1, p: 2 }}>
                        <Typography variant="body2" color="text.secondary">Profit Factor</Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {metrics.profitFactor}
                        </Typography>
                    </FloatingCard>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.4} sx={{ flexGrow: 1, p: 2 }}>
                        <Typography variant="body2" color="text.secondary">Total Trades</Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {metrics.totalTrades}
                        </Typography>
                    </FloatingCard>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.5} sx={{ flexGrow: 1, p: 2 }}>
                        <Typography variant="body2" color="text.secondary">Risk Reward</Typography>
                        <Typography variant="h5" fontWeight="bold">
                            1:{metrics.riskRewardRatio}
                        </Typography>
                    </FloatingCard>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.6} sx={{ flexGrow: 1, p: 2 }}>
                        <Typography variant="body2" color="text.secondary">Avg Holding Time</Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {metrics.avgHoldingTime || '0h 0m'}
                        </Typography>
                    </FloatingCard>
                </Grid>

                {/* Row 1.5: Charts (Equity & Drawdown) */}
                <Grid size={{ xs: 12, lg: 8 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.65} sx={{ flexGrow: 1, minHeight: 450, width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" display="flex" alignItems="center"><ShowChart sx={{ mr: 1 }} /> Balance Curve</Typography>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h5" fontWeight="bold" color={metrics.currentBalance >= account.accountSize ? 'success.main' : 'error.main'}>
                                    ${metrics.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Account Balance</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ height: 350 }}>
                            <EquityChart
                                data={chartData}
                                dataKey="value"
                                strokeColor="#2196f3"
                                referenceLineValue={account.accountSize}
                                referenceLineLabel="STARTING DEPOSIT"
                            />
                        </Box>
                    </FloatingCard>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.68} sx={{ flexGrow: 1, width: '100%' }}>
                        <Typography variant="h6" mb={2}>Drawdown Curve</Typography>
                        <DrawdownCurve data={dashboardData.advancedMetrics?.drawdownCurve || []} />
                    </FloatingCard>
                </Grid>

                {/* Row 2: Yearly Performance Grid */}
                <Grid size={{ xs: 12 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.7} sx={{ flexGrow: 1, width: '100%' }}>
                        <Typography variant="h6" mb={2}>Yearly Performance</Typography>
                        <YearlyPerformanceGrid data={dashboardData.advancedMetrics?.yearlyPerformance || {}} />
                    </FloatingCard>
                </Grid>

                {/* Row 3: Weekly / Duration Charts */}
                <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.8} sx={{ flexGrow: 1, width: '100%' }}>
                        <Typography variant="h6" mb={2} fontSize={16}>Weekly Win Rate</Typography>
                        <WeeklyWinRateChart data={dashboardData.advancedMetrics?.tradesByWeekDay || {}} />
                    </FloatingCard>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.9} sx={{ flexGrow: 1, width: '100%' }}>
                        <Typography variant="h6" mb={2} fontSize={16}>Profit & Loss by Trade Duration</Typography>
                        <TimeAnalysisCharts
                            durationData={dashboardData.advancedMetrics?.tradesByDuration || []}
                            timeOfDayData={[]} // Only show duration here
                        />
                    </FloatingCard>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={1.0} sx={{ flexGrow: 1, width: '100%' }}>
                        <Typography variant="h6" mb={2} fontSize={16}>Weekly Trading Frequency</Typography>
                        <WeeklyTradingFrequencyChart data={dashboardData.advancedMetrics?.tradesByWeekDay || {}} />
                    </FloatingCard>
                </Grid>

                {/* Row 4: Hourly / Monthly Charts */}
                <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={1.1} sx={{ flexGrow: 1, width: '100%' }}>
                        <Typography variant="h6" mb={2} fontSize={16}>Hourly Win Rate</Typography>
                        <HourlyWinRateChart data={dashboardData.advancedMetrics?.tradesByHour || {}} />
                    </FloatingCard>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={1.2} sx={{ flexGrow: 1, width: '100%' }}>
                        <Typography variant="h6" mb={2} fontSize={16}>Hourly Trading Frequency</Typography>
                        <HourlyTradingFrequencyChart data={dashboardData.advancedMetrics?.tradesByHour || {}} />
                    </FloatingCard>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={1.3} sx={{ flexGrow: 1, width: '100%' }}>
                        <Typography variant="h6" mb={2} fontSize={16}>Profit by Month</Typography>
                        <ProfitByMonthChart data={dashboardData.advancedMetrics?.profitByMonth || {}} />
                    </FloatingCard>
                </Grid>

                {/* Row 5: Calendar */}
                <Grid size={{ xs: 12 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={1.4} sx={{ flexGrow: 1, width: '100%' }}>
                        <ProfitCalendar
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            data={calendarData}
                            title="Trading Session Calendar"
                            onDayClick={handleDayClick}
                        />
                    </FloatingCard>
                </Grid>
            </Grid>

            <SetupVantageAccountDialog
                open={openSetup}
                onClose={() => setOpenSetup(false)}
                accountName={accountName}
                setAccountName={setAccountName}
                depositAmount={depositAmount}
                setDepositAmount={setDepositAmount}
                onCreate={handleCreateAccount}
            />

            <EditVantageAccountDialog
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                accountName={accountName}
                setAccountName={setAccountName}
                depositAmount={depositAmount}
                setDepositAmount={setDepositAmount}
                balanceAdjustment={balanceAdjustment}
                setBalanceAdjustment={setBalanceAdjustment}
                onUpdate={handleUpdateAccount}
            />

            <DayTradesModal
                isOpen={showDayTrades}
                onClose={() => setShowDayTrades(false)}
                date={selectedDay}
                trades={tradesList.filter(t => t.propAccountId === selectedAccountId)}
            />
        </Box>
    );
};

export default Dashboard;
