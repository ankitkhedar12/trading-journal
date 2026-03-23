import { Box, Typography, CircularProgress, Button, Grid, Chip, Alert, Select, MenuItem } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContextType';
import { getBaseUrl } from '../../utils/config';
import { usePropDashboard, useInvalidateTrades, useAllTrades, usePropAccounts } from '../../hooks/useTradeQueries';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ShowChart } from '@mui/icons-material';
import { getSecureHeaders } from '../../utils/security';
import { BROKERS, ACCOUNT_TYPES, ACCOUNT_STATUS } from '../../constants/common';
import { formatCalendarData, getBrokerKeyFromFirmName } from '../../utils/tradeUtils';

import FloatingCard from '../../components/common/FloatingCard';
import ProfitCalendar from '../../components/common/ProfitCalendar';
import EquityChart from '../../components/charts/EquityChart';
import DayTradesModal from '../../components/common/DayTradesModal';
import EditAccountDialog from './components/EditAccountDialog';
import AccountSetupCenter from './components/AccountSetupCenter';
import ObjectiveRules from './components/ObjectiveRules';
import AccountMatrix from './components/AccountMatrix';

const LEVERAGE_INFO: Record<string, string> = {
    'INSTANT': 'FX 1:30 • Comm 1:10 • Crypto 1:1',
    '1_STEP': 'FX 1:30 • Comm 1:10 • Crypto 1:1',
    '2_STEP': 'FX 1:100 • Comm 1:30 • Crypto 1:2'
};

const PropDashboard = () => {
    const { user } = useAuth();
    const invalidateTrades = useInvalidateTrades();
    const [openSetup, setOpenSetup] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    // Form State
    const [firmName, setFirmName] = useState<string>(BROKERS.THE_FUNDED_ROOM);
    const [accountType, setAccountType] = useState<string>(ACCOUNT_TYPES.ONE_STEP);
    const [accountSize, setAccountSize] = useState<number>(100000);
    const [status, setStatus] = useState<string>(ACCOUNT_STATUS.PHASE_1);
    const [hasHftWarning, setHasHftWarning] = useState<boolean>(false);

    // Day Selection State
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [showDayTrades, setShowDayTrades] = useState(false);

    // Account Selection State
    const { data: propAccounts = [] } = usePropAccounts();
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [selectedPhase, setSelectedPhase] = useState<string>('');

    useEffect(() => {
        if (propAccounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(propAccounts[0].id);
            setSelectedPhase(propAccounts[0].status);
        }
    }, [propAccounts, selectedAccountId]);

    const handleAccountChange = (accountId: string) => {
        const acc = propAccounts.find(a => a.id === accountId);
        setSelectedAccountId(accountId);
        setSelectedPhase(acc ? acc.status : '');
    };

    const getAvailablePhases = (accountId: string) => {
        const acc = propAccounts.find(a => a.id === accountId);
        if (!acc) return [];
        if (acc.accountType === ACCOUNT_TYPES.INSTANT) return [ACCOUNT_STATUS.FUNDED, ACCOUNT_STATUS.FAILED].filter(p => p !== ACCOUNT_STATUS.FAILED || acc.status === ACCOUNT_STATUS.FAILED);
        if (acc.accountType === ACCOUNT_TYPES.ONE_STEP) return [ACCOUNT_STATUS.PHASE_1, ACCOUNT_STATUS.FUNDED, ACCOUNT_STATUS.FAILED].filter(p => p !== ACCOUNT_STATUS.FAILED || acc.status === ACCOUNT_STATUS.FAILED);
        return [ACCOUNT_STATUS.PHASE_1, ACCOUNT_STATUS.PHASE_2, ACCOUNT_STATUS.FUNDED, ACCOUNT_STATUS.FAILED].filter(p => p !== ACCOUNT_STATUS.FAILED || acc.status === ACCOUNT_STATUS.FAILED);
    };

    const { data: dashboardData = null, isLoading } = usePropDashboard(selectedAccountId, selectedPhase);
    const { data: tradesList = [] } = useAllTrades();

    // Pre-fill form when data loads
    useEffect(() => {
        if (dashboardData?.account) {
            if (dashboardData.account.firmName !== firmName) setFirmName(dashboardData.account.firmName);
            if (dashboardData.account.accountType !== accountType) setAccountType(dashboardData.account.accountType);
            if (dashboardData.account.accountSize !== accountSize) setAccountSize(dashboardData.account.accountSize);
            if (dashboardData.account.status !== status) setStatus(dashboardData.account.status);
            if (dashboardData.account.hasHftWarning !== hasHftWarning) setHasHftWarning(dashboardData.account.hasHftWarning);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dashboardData?.account]);

    useEffect(() => {
        if (!dashboardData?.account) {
            const defaultStatus = accountType === ACCOUNT_TYPES.INSTANT ? ACCOUNT_STATUS.FUNDED : ACCOUNT_STATUS.PHASE_1;
            if (status !== defaultStatus && status !== ACCOUNT_STATUS.FAILED) {
                setStatus(defaultStatus);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountType]);

    const invalidatePropData = () => invalidateTrades();

    const handleCreateAccount = async () => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/prop-account`, {
                method: 'POST',
                headers: getSecureHeaders(user?.token),
                body: JSON.stringify({ firmName, accountType, accountSize: Number(accountSize), status, hasHftWarning })
            });
            if (res.ok) {
                toast.success('Prop Firm Account created successfully!');
                setOpenSetup(false);
                invalidatePropData();
            } else {
                toast.error('Failed to create account.');
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
                body: JSON.stringify({ firmName, accountType, accountSize: Number(accountSize), status, hasHftWarning })
            });
            if (res.ok) {
                setOpenEdit(false);
                invalidatePropData();
            }
        } catch {
            // Error handled server-side
        }
    };

    const handleDeleteAccount = async () => {
        if (!dashboardData?.account?.id) return;
        if (!window.confirm("Are you sure you want to delete this account? This will remove all tracking for this prop firm.")) return;
        try {
            await fetch(`${getBaseUrl()}/api/prop-account/${dashboardData.account.id}`, {
                method: 'DELETE',
                headers: getSecureHeaders(user?.token),
            });
            invalidatePropData();
        } catch {
            // Error handled server-side
        }
    };

    const calendarData = useMemo(() => {
        const firmName = dashboardData?.account?.firmName || '';
        const brokerKey = getBrokerKeyFromFirmName(firmName);
        const filteredTrades = tradesList.filter(t => t.broker === brokerKey);
        return formatCalendarData(filteredTrades);
    }, [tradesList, dashboardData?.account?.firmName]);

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

    if (isLoading || (propAccounts.length > 0 && !dashboardData?.account)) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
    }

    // --- SETUP VIEW ---
    if (!dashboardData?.account) {
        return (
            <Box className="funded-page">
                <AccountSetupCenter
                    openSetup={openSetup}
                    setOpenSetup={setOpenSetup}
                    firmName={firmName}
                    setFirmName={setFirmName}
                    accountType={accountType}
                    setAccountType={setAccountType}
                    accountSize={accountSize}
                    setAccountSize={setAccountSize}
                    status={status}
                    setStatus={setStatus}
                    hasHftWarning={hasHftWarning}
                    setHasHftWarning={setHasHftWarning}
                    onCreate={handleCreateAccount}
                />
            </Box>
        );
    }

    const { account, metrics, rules, chartData, violationMessage } = dashboardData;
    const isFailed = account.status === ACCOUNT_STATUS.FAILED;

    return (
        <Box className="funded-page" sx={{ gap: 2.5 }}>


            {/* Header */}
            <Box className="funded-header">
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {account.firmName}
                        <Chip label={account.accountType.replace('_', ' ')} color="primary" size="small" variant="outlined" />
                        <Chip label={account.status.replace('_', ' ')} color={isFailed ? "error" : "success"} size="small" />
                    </Typography>
                    <Typography color="text.secondary" variant="h6">
                        ${account.accountSize.toLocaleString()} Account • {account.firmName}
                    </Typography>
                    <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}>
                        LEVERAGE: {LEVERAGE_INFO[account.accountType] || 'N/A'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" size="small" onClick={() => setOpenSetup(true)} sx={{ borderRadius: '10px !important' }}>+ New Account</Button>
                    <Button variant="outlined" size="small" onClick={() => setOpenEdit(true)} sx={{ borderRadius: '10px !important' }}>Edit Account</Button>
                    <Button variant="outlined" color="error" size="small" onClick={handleDeleteAccount} sx={{ borderRadius: '10px !important' }}>Delete</Button>
                </Box>
            </Box>

            {/* Account & Phase Selectors */}
            {propAccounts.length > 0 && dashboardData?.account && (
                <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
                    <Select
                        size="small"
                        value={selectedAccountId}
                        onChange={(e) => handleAccountChange(e.target.value as string)}
                        sx={{ borderRadius: '15px', minWidth: 200 }}
                    >
                        {propAccounts.map(acc => (
                            <MenuItem key={acc.id} value={acc.id}>
                                {acc.firmName} ({acc.accountType.replace('_', ' ')})
                            </MenuItem>
                        ))}
                    </Select>
                    
                    <Select
                        size="small"
                        value={selectedPhase}
                        onChange={(e) => setSelectedPhase(e.target.value as string)}
                        sx={{ borderRadius: '15px', minWidth: 120 }}
                    >
                        {getAvailablePhases(selectedAccountId).map(p => (
                            <MenuItem key={p} value={p}>{p.replace('_', ' ')}</MenuItem>
                        ))}
                    </Select>
                </Box>
            )}

            {/* Violation Alerts */}
            <AnimatePresence>
                {(isFailed || violationMessage || account.hasHftWarning) && (
                    <Box component="div">
                        <Alert
                            severity={isFailed ? "error" : "warning"}
                            variant="filled"
                            sx={{
                                borderRadius: '20px',
                                fontWeight: 'bold',
                                // boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                                background: "rgba(237, 108, 2, 0.9)"
                            }}
                            action={isFailed ? (
                                <Button color="inherit" size="small" onClick={() => setOpenEdit(true)}>FIX / OVERRIDE</Button>
                            ) : null}
                        >
                            {isFailed
                                ? `ACCOUNT FAILED: ${violationMessage || "A rule has been violated. The account is marked as Failed."}`
                                : account.hasHftWarning
                                    ? "HFT VIOLATION WARNING: Our system detected High-Frequency Trading (4+ orders in 3 mins). Please note that a second offense will result in immediate account failure."
                                    : violationMessage
                            }
                        </Alert>
                    </Box>
                )}
            </AnimatePresence>

            <Grid container spacing={4}>
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
                            <EquityChart
                                data={chartData}
                                dataKey="value"
                                strokeColor="#9c27b0"
                                referenceLineValue={account.accountSize}
                                referenceLineLabel="INITIAL"
                            />
                        </Box>
                    </FloatingCard>
                </Grid>

                <Grid size={{ xs: 12, lg: 3 }} sx={{ display: 'flex' }}>
                    <ObjectiveRules rules={rules} />
                </Grid>

                {/* Calendar and Stats */}
                <Grid size={{ xs: 12, lg: 9 }} sx={{ display: 'flex' }}>
                    <FloatingCard delay={0.3} sx={{ flexGrow: 1, width: '100%' }}>
                        <ProfitCalendar
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            data={calendarData}
                            title="Trading Session Calendar"
                            onDayClick={handleDayClick}
                        />
                    </FloatingCard>
                </Grid>

                <Grid size={{ xs: 12, lg: 3 }} sx={{ display: 'flex' }}>
                    <AccountMatrix
                        metrics={metrics}
                        currentDate={currentDate}
                        totalTradesThisMonth={totalTradesThisMonth}
                    />
                </Grid>
            </Grid>

            <EditAccountDialog
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                firmName={firmName}
                accountType={accountType}
                accountSize={accountSize}
                status={status}
                setStatus={setStatus}
                hasHftWarning={hasHftWarning}
                setHasHftWarning={setHasHftWarning}
                onUpdate={handleUpdateAccount}
            />
            <DayTradesModal
                isOpen={showDayTrades}
                onClose={() => setShowDayTrades(false)}
                date={selectedDay}
                trades={tradesList.filter(t => {
                    const firm = dashboardData?.account?.firmName || '';
                    const bKey = getBrokerKeyFromFirmName(firm);
                    return t.broker === bKey;
                })}
            />
        </Box>
    );
};

export default PropDashboard;
