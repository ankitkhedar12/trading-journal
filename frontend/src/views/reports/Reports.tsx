import { useState, useMemo } from 'react';
import { Box, Typography, CircularProgress, MenuItem, Select, FormControl, InputLabel, Tabs, Tab, Grid, } from '@mui/material';
import { BarChart, Bar, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { motion } from 'framer-motion';

import { useAllTrades, usePropAccounts, useDashboardStats } from '../../hooks/useTradeQueries';
import { useThemeContext } from '../../context/ThemeContextType';
import TradeItem from '../../components/common/TradeItem';
import TradeDetailsModal from './TradeDetailsModal';
import SortIcon from '../../components/common/SortIcon';
import GlassCard from '../../components/common/GlassCard';
import StatBox from '../../components/common/StatBox';
import CustomScatterTooltip from '../../components/charts/CustomScatterTooltip';
import CustomBarTooltip from '../../components/charts/CustomBarTooltip';
import type { Trade } from '../../types/trade';
import type { SortKey, SortOrder } from '../../types/reports';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// ==========================================
// Main Component
// ==========================================
const Reports = () => {
    const { mode } = useThemeContext();
    const isDark = mode === 'dark';

    const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
    const { data: trades = [], isLoading: tradesLoading } = useAllTrades();
    const { data: propAccounts = [], isLoading: accountsLoading } = usePropAccounts();
    const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats(selectedAccountId);

    const [sortKey, setSortKey] = useState<SortKey>('Date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [currentTab, setCurrentTab] = useState(0);
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

    const vantageAccounts = useMemo(() => {
        return propAccounts.filter(acc => acc.firmName === 'Vantage');
    }, [propAccounts]);

    const sortedTrades = useMemo(() => {
        if (!trades) return [];
        let filteredTrades = trades;
        if (selectedAccountId !== 'ALL') {
            filteredTrades = trades.filter(t => t.propAccountId === selectedAccountId);
        }
        return [...filteredTrades].sort((a, b) => {
            let valA: number = 0, valB: number = 0;
            if (sortKey === 'Date') { valA = new Date(a.openedAt).getTime(); valB = new Date(b.openedAt).getTime(); }
            else if (sortKey === 'PnL') { valA = a.pnl; valB = b.pnl; }
            else if (sortKey === 'Lots') { valA = parseFloat(a.volume); valB = parseFloat(b.volume); }
            else if (sortKey === 'Duration') { valA = new Date(a.closedAt).getTime() - new Date(a.openedAt).getTime(); valB = new Date(b.closedAt).getTime() - new Date(b.openedAt).getTime(); }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [trades, sortKey, sortOrder, selectedAccountId]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortOrder('desc'); }
    };

    if (tradesLoading || accountsLoading || statsLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress size={60} thickness={4} sx={{ color: '#10b981' }} />
            </Box>
        );
    }

    const { scatterData = [], histogramData = [], behavioralStats } = dashboardStats || {};

    return (
        <Box className="reports-page" sx={{ pb: 10 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: '900', letterSpacing: '-1px', background: isDark ? 'linear-gradient(90deg, #fff, #94a3b8)' : 'linear-gradient(90deg, #0f172a, #475569)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Advanced Edge Analytics
                    </Typography>
                    <Typography color="text.secondary">Deep dive into your psychological and statistical edges.</Typography>
                </Box>

                {vantageAccounts.length > 0 && (
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel id="account-select-label" sx={{ color: 'text.secondary' }}>Account Filter</InputLabel>
                        <Select
                            labelId="account-select-label"
                            value={selectedAccountId}
                            label="Account Filter"
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            sx={{ borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: 'text.primary' }}
                        >
                            <MenuItem value="ALL">All Accounts Portfolio</MenuItem>
                            {vantageAccounts.map(acc => (
                                <MenuItem key={acc.id} value={acc.id}>
                                    Vantage ({acc.accountType})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Box>

            <Box component={motion.div} variants={containerVariants} initial="hidden" animate="show">
                {/* Top Row: Behavioral Stats */}
                <Typography variant="h5" fontWeight="bold" mb={2} color="text.primary">Behavioral Edge (Conditional Probabilities)</Typography>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <GlassCard isDark={isDark}>
                            <StatBox
                                title="Win after a Win"
                                value={`${behavioralStats?.winAfterWin.toFixed(0) || 0}%`}
                                color="#10b981"
                                subtext="Do you compound success?"
                            />
                        </GlassCard>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <GlassCard>
                            <StatBox
                                title="Loss after a Win"
                                value={`${behavioralStats?.lossAfterWin.toFixed(0) || 0}%`}
                                color="#ef4444"
                                subtext="Do you get overconfident?"
                            />
                        </GlassCard>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <GlassCard>
                            <StatBox
                                title="Loss after a Loss"
                                value={`${behavioralStats?.lossAfterLoss.toFixed(0) || 0}%`}
                                color="#ef4444"
                                subtext="Do you revenge trade / tilt?"
                            />
                        </GlassCard>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <GlassCard>
                            <StatBox
                                title="Win after a Loss"
                                value={`${behavioralStats?.winAfterLoss.toFixed(0) || 0}%`}
                                color="#10b981"
                                subtext="Do you bounce back properly?"
                            />
                        </GlassCard>
                    </Grid>
                </Grid>

                {/* Middle Row: Scatter Plots */}
                <Typography variant="h5" fontWeight="bold" mb={2} color="text.primary">Execution Edge (Scatter Plots)</Typography>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <GlassCard isDark={isDark}>
                            <Typography variant="h6" fontWeight="bold" mb={2} color="text.primary">Volume vs PnL</Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>Do your biggest lot sizes correspond to your biggest losses?</Typography>
                            <Box sx={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)"} />
                                        <XAxis type="number" dataKey="volume" name="Lots" stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} tick={{ fill: isDark ? '#94a3b8' : '#475569' }} label={{ value: 'Lot Size', position: 'insideBottomRight', fill: isDark ? '#94a3b8' : '#475569' }} />
                                        <YAxis type="number" dataKey="pnl" name="PnL" stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} tick={{ fill: isDark ? '#94a3b8' : '#475569' }} label={{ value: 'Profit / Loss ($)', angle: -90, position: 'insideLeft', fill: isDark ? '#94a3b8' : '#475569' }} />
                                        <ZAxis type="number" range={[100, 100]} />
                                        <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                        <Scatter data={scatterData} shape="circle">
                                            {scatterData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'} />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </Box>
                        </GlassCard>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 6 }}>
                        <GlassCard isDark={isDark}>
                            <Typography variant="h6" fontWeight="bold" mb={2} color="text.primary">Holding Duration vs PnL</Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>Do you cut losers short and let winners run?</Typography>
                            <Box sx={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)"} />
                                        <XAxis type="number" dataKey="durationMinutes" name="Minutes" stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} tick={{ fill: isDark ? '#94a3b8' : '#475569' }} label={{ value: 'Duration (Minutes)', position: 'insideBottomRight', fill: isDark ? '#94a3b8' : '#475569' }} />
                                        <YAxis type="number" dataKey="pnl" name="PnL" stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} tick={{ fill: isDark ? '#94a3b8' : '#475569' }} label={{ value: 'Profit / Loss ($)', angle: -90, position: 'insideLeft', fill: isDark ? '#94a3b8' : '#475569' }} />
                                        <ZAxis type="number" range={[100, 100]} />
                                        <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                        <Scatter data={scatterData} shape="circle">
                                            {scatterData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'} />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </Box>
                        </GlassCard>
                    </Grid>
                </Grid>

                {/* Bottom Row: Histogram */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12 }}>
                        <GlassCard isDark={isDark}>
                            <Typography variant="h6" fontWeight="bold" mb={2} color="text.primary">Returns Distribution (Bell Curve)</Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>Is your strategy consistent, or do you rely on massive outliers?</Typography>
                            <Box sx={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={histogramData.map((d: any) => ({ ...d, isDark }))} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)"} vertical={false} />
                                        <XAxis dataKey="range" stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} tick={{ fill: isDark ? '#94a3b8' : '#475569' }} />
                                        <YAxis stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} tick={{ fill: isDark ? '#94a3b8' : '#475569' }} allowDecimals={false} label={{ value: 'Number of Trades', angle: -90, position: 'insideLeft', fill: isDark ? '#94a3b8' : '#475569' }} />
                                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {histogramData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.range.includes('-') && entry.range !== '$0 to $100' && entry.range !== '$100 to $500' && entry.range !== '>$500' ? '#ef4444' : '#10b981'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </GlassCard>
                    </Grid>
                </Grid>
            </Box>

            {/* Bottom Section: Tabs for Details */}
            <Box sx={{ mt: 6 }}>
                <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}
                    sx={{
                        mb: 3,
                        '& .MuiTab-root': { color: 'text.secondary', fontWeight: 'bold' },
                        '& .Mui-selected': { color: 'primary.main' }
                    }}
                >
                    <Tab label="Trade List" />
                    <Tab label="Symbols Analytics" />
                    <Tab label="Strategies" />
                    <Tab label="Tags" />
                </Tabs>

                {currentTab === 0 && (
                    sortedTrades.length === 0 ? (
                        <GlassCard isDark={isDark} sx={{ textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary">No trades found. Go to Import to add your data.</Typography>
                        </GlassCard>
                    ) : (
                        <GlassCard isDark={isDark} sx={{ p: { xs: 2, sm: 4 } }}>
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, px: 2.5, mb: 2, borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', pb: 2 }}>
                                <Typography variant="subtitle2" sx={{ flex: 1.2, fontWeight: 'bold', color: 'text.secondary' }}>Symbol</Typography>
                                <Typography variant="subtitle2" sx={{ flex: 0.8, fontWeight: 'bold', color: 'text.secondary', cursor: 'pointer' }} onClick={() => handleSort('Lots')}>
                                    Vol(Lots) <SortIcon column="Lots" sortKey={sortKey} sortOrder={sortOrder} />
                                </Typography>
                                <Typography variant="subtitle2" sx={{ flex: 1.5, fontWeight: 'bold', color: 'text.secondary' }}>Entry / Close</Typography>
                                <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary', cursor: 'pointer' }} onClick={() => handleSort('PnL')}>
                                    PnL <SortIcon column="PnL" sortKey={sortKey} sortOrder={sortOrder} />
                                </Typography>
                                <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 'bold', color: 'text.secondary', cursor: 'pointer' }} onClick={() => handleSort('Duration')}>
                                    Duration <SortIcon column="Duration" sortKey={sortKey} sortOrder={sortOrder} />
                                </Typography>
                                <Typography variant="subtitle2" sx={{ flex: 1.5, fontWeight: 'bold', color: 'text.secondary', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('Date')}>
                                    Date <SortIcon column="Date" sortKey={sortKey} sortOrder={sortOrder} />
                                </Typography>
                            </Box>
                            <Box>
                                {sortedTrades.map((row, index) => (
                                    <TradeItem key={row.id} trade={row} index={index} onOpenJournal={() => setSelectedTrade(row)} />
                                ))}
                            </Box>
                        </GlassCard>
                    )
                )}

                {/* Symbols */}
                {currentTab === 1 && dashboardStats?.breakdowns?.symbols && (
                    <Grid container spacing={3}>
                        {Object.entries(dashboardStats.breakdowns.symbols).map(([symbol, data]: [string, any]) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={symbol}>
                                <GlassCard isDark={isDark}>
                                    <Typography variant="h5" fontWeight="bold" mb={1} color="text.primary">{symbol}</Typography>
                                    <Typography color="text.secondary" variant="body2">Trades: {data.trades}</Typography>
                                    <Typography color={data.pnl > 0 ? '#10b981' : '#ef4444'} fontWeight="bold" variant="h6" my={1}>${data.pnl.toFixed(2)}</Typography>
                                    <Typography variant="body2" color="text.secondary">Win Rate: {((data.win / data.trades) * 100).toFixed(0)}%</Typography>
                                </GlassCard>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Strategies */}
                {currentTab === 2 && dashboardStats?.breakdowns?.strategies && (
                    <Grid container spacing={3}>
                        {Object.entries(dashboardStats.breakdowns.strategies).length === 0 && (
                            <Typography p={3} color="text.secondary">No strategy data.</Typography>
                        )}
                        {Object.entries(dashboardStats.breakdowns.strategies).map(([strategy, data]: [string, any]) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={strategy}>
                                <GlassCard isDark={isDark}>
                                    <Typography variant="h6" fontWeight="bold" mb={1} color="text.primary">{strategy}</Typography>
                                    <Typography color="text.secondary" variant="body2">Trades: {data.trades}</Typography>
                                    <Typography color={data.pnl > 0 ? '#10b981' : '#ef4444'} fontWeight="bold" variant="h6" my={1}>${data.pnl.toFixed(2)}</Typography>
                                    <Typography variant="body2" color="text.secondary">Win Rate: {((data.win / data.trades) * 100).toFixed(0)}%</Typography>
                                </GlassCard>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Tags */}
                {currentTab === 3 && dashboardStats?.breakdowns?.tags && (
                    <Grid container spacing={3}>
                        {Object.entries(dashboardStats.breakdowns.tags).length === 0 && (
                            <Typography p={3} color="text.secondary">No tags data.</Typography>
                        )}
                        {Object.entries(dashboardStats.breakdowns.tags).map(([tag, data]: [string, any]) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={tag}>
                                <GlassCard isDark={isDark}>
                                    <Typography variant="h6" fontWeight="bold" mb={1} color="text.primary">{tag}</Typography>
                                    <Typography color="text.secondary" variant="body2">Trades: {data.trades}</Typography>
                                    <Typography color={data.pnl > 0 ? '#10b981' : '#ef4444'} fontWeight="bold" variant="h6" my={1}>${data.pnl.toFixed(2)}</Typography>
                                    <Typography variant="body2" color="text.secondary">Win Rate: {((data.win / data.trades) * 100).toFixed(0)}%</Typography>
                                </GlassCard>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            <TradeDetailsModal
                open={!!selectedTrade}
                onClose={() => setSelectedTrade(null)}
                trade={selectedTrade}
            />
        </Box>
    );
};

export default Reports;
