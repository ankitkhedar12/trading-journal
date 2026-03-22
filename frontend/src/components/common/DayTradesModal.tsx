import React, { useMemo } from 'react';
import { Modal, Box, Typography, IconButton, Paper } from '@mui/material';
import { Close } from '@mui/icons-material';
import { format, isSameDay } from 'date-fns';
import type { DayTradesModalProps } from '../../types/trade';
import TradeItem from './TradeItem';
import { useThemeContext } from '../../context/ThemeContextType';
import { detectTradeViolations } from '../../utils/tradeUtils';

const DayTradesModal: React.FC<DayTradesModalProps> = ({ isOpen, onClose, date, trades }) => {
    const { mode, glassMode } = useThemeContext();

    const dailyTrades = useMemo(() => {
        if (!date) return [];
        return trades.filter(t => isSameDay(new Date(t.openedAt), date))
            .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
    }, [date, trades]);

    const tradesWithViolations = useMemo(() => {
        return detectTradeViolations(dailyTrades);
    }, [dailyTrades]);

    const totalDayPnl = tradesWithViolations.reduce((sum, t) => sum + t.pnl, 0);

    // Dynamic background based on mode and glassMode
    const isDark = mode === 'dark';

    const modalBg = isDark
        ? (glassMode === 'clear' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 20, 35, 0.8)')
        : (glassMode === 'clear' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.9)');

    const backdropFilter = glassMode === 'clear'
        ? 'blur(12px) saturate(160%)'
        : 'blur(25px) saturate(180%)';

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 1, sm: 2 },
                // backdropFilter: 'blur(8px)',
            }}
        >
            <Paper
                elevation={isDark ? 0 : 2}
                sx={{
                    width: { xs: '95%', md: '70%' },
                    maxHeight: '85vh',
                    borderRadius: '30px',
                    outline: 'none',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isDark
                        ? '0 20px 60px rgba(0,0,0,0.6)'
                        : '0 20px 60px rgba(0,0,0,0.1)',
                    border: isDark
                        ? '1px solid rgba(255,255,255,0.08)'
                        : '1px solid rgba(0,0,0,0.05)',
                    bgcolor: modalBg,
                    backdropFilter: backdropFilter,
                    position: 'relative',
                    backgroundImage: 'none', // Remove MUI default overlay in dark mode
                    scrollbarColor: "rgba(0,0,0,0.1) transparent"
                }}
            >
                {/* Header */}
                <Box sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {date ? format(date, 'MMMM d, yyyy') : 'Trades'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {dailyTrades.length} Trades executed this day
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 3 } }}>
                        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Total PnL</Typography>
                            <Typography variant="h6" sx={{
                                fontWeight: 'bold',
                                color: totalDayPnl >= 0 ? 'success.main' : 'error.main'
                            }}>
                                {totalDayPnl >= 0 ? '+' : ''}{totalDayPnl.toFixed(2)}
                            </Typography>
                        </Box>
                        <IconButton
                            onClick={onClose}
                            sx={{
                                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                color: 'text.primary',
                                '&:hover': {
                                    bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                }
                            }}
                        >
                            <Close />
                        </IconButton>
                    </Box>
                </Box>

                {/* Content */}
                <Box sx={{ p: { xs: 2, sm: 4 }, overflowY: 'auto', flex: 1 }}>
                    {dailyTrades.length === 0 ? (
                        <Box sx={{ py: 10, textAlign: 'center' }}>
                            <Typography sx={{ color: 'text.secondary' }}>No trades record for this day.</Typography>
                        </Box>
                    ) : (
                        <Box>
                            {/* Column Names (Visible on Desktop) */}
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, px: 2.5, mb: 1, color: 'text.secondary' }}>
                                <Typography variant="caption" sx={{ flex: 1.2 }}>SYMBOL / SIDE</Typography>
                                <Typography variant="caption" sx={{ flex: 0.8 }}>LOTS</Typography>
                                <Typography variant="caption" sx={{ flex: 1.5 }}>ENTRY &rarr; EXIT</Typography>
                                <Typography variant="caption" sx={{ flex: 1 }}>PNL</Typography>
                                <Typography variant="caption" sx={{ flex: 1 }}>DURATION</Typography>
                                <Typography variant="caption" sx={{ flex: 1.5, textAlign: 'right' }}>TIME</Typography>
                            </Box>

                            {tradesWithViolations.map((trade, index) => (
                                <TradeItem
                                    key={trade.id}
                                    trade={trade}
                                    index={index}
                                    isViolation={trade.isViolation}
                                    violationType={trade.violationType}
                                />
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Footer */}
                <Box sx={{
                    p: 2,
                    textAlign: 'center',
                    background: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Rules check based on The Funded Room criteria for precise HFT & Hedging checks.
                    </Typography>
                </Box>
            </Paper>
        </Modal>
    );
};

export default DayTradesModal;
