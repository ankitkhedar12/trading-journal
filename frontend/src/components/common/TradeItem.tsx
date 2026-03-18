import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { useThemeContext } from '../../context/ThemeContextType';

import type { TradeItemProps } from '../../types/trade';

const TradeItem: React.FC<TradeItemProps> = ({ trade, index, isViolation, violationType }) => {
    const { mode } = useThemeContext();
    const isDark = mode === 'dark';

    const getPnlColor = (pnl: number) => {
        return pnl > 0 ? '#4caf50' : pnl < 0 ? '#f44336' : '#9e9e9eff';
    };

    const getPnlBg = (pnl: number) => {
        // Higher opacity for visibility in Dark Mode
        if (isViolation) {
            return isDark ? 'rgba(244, 67, 54, 0.35)' : 'rgba(211, 47, 47, 0.15)';
        }
        
        if (isDark) {
            return pnl > 0 ? 'rgba(76, 175, 80, 0.1)' : pnl < 0 ? 'rgba(244, 67, 54, 0.1)' : 'rgba(158, 158, 158, 0.05)';
        }
        return pnl > 0 ? 'rgba(76, 175, 80, 0.05)' : pnl < 0 ? 'rgba(211, 47, 47, 0.05)' : 'rgba(158, 158, 158, 0.03)';
    };

    const formatDuration = (start: string, end: string) => {
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        
        if (isNaN(startTime) || isNaN(endTime)) return '-';
        
        const ms = endTime - startTime;
        if (ms < 0) return '0s';
        if (ms < 1000 && ms > 0) return `${ms}ms`;
        
        const sec = Math.floor(ms / 1000);
        if (sec < 60) return `${sec}s`;
        
        const min = Math.floor(sec / 60);
        const remSec = sec % 60;
        if (min < 60) return `${min}m ${remSec}s`;
        
        const hr = Math.floor(min / 60);
        const remMin = min % 60;
        return `${hr}h ${remMin}m`;
    };

    const duration = formatDuration(trade.openedAt, trade.closedAt);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.03 }}
        >
            <Paper
                className="report-trade-row"
                sx={{
                    bgcolor: getPnlBg(trade.pnl),
                    borderLeft: `4px solid ${trade.side === 'Long' ? '#4caf50' : '#f44336'}`,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 20px',
                    borderRadius: '15px',
                    mb: 1,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    boxShadow: isViolation && isDark ? '0 0 20px rgba(244, 67, 54, 0.15)' : 'none',
                    '&:hover': {
                        bgcolor: isViolation ? (isDark ? 'rgba(244, 67, 54, 0.45)' : 'rgba(211, 47, 47, 0.25)') : undefined,
                        transform: 'translateX(5px)'
                    }
                }}
            >
                {isViolation && (
                    <Box sx={{
                        position: 'absolute',
                        top: 2,
                        right: 10,
                        bgcolor: '#f44336',
                        color: 'white',
                        px: 1,
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 8px rgba(244, 67, 54, 0.5)'
                    }}>
                        RULE VIOLATION: {violationType}
                    </Box>
                )}

                <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        {trade.symbol}
                    </Typography>
                </Box>

                <Typography variant="body2" sx={{ flex: 0.8, color: 'text.secondary' }}>
                    {trade.volume}
                </Typography>

                <Typography variant="body2" sx={{ flex: 1.5, fontSize: '0.8rem', color: 'text.secondary' }}>
                    {trade.entryPrice} &rarr; {trade.closePrice}
                </Typography>

                <Typography variant="body2" sx={{ flex: 1, fontWeight: 'bold', color: getPnlColor(trade.pnl) }}>
                    {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                </Typography>

                <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
                    {duration}
                </Typography>

                <Typography variant="caption" sx={{ flex: 1.5, color: 'text.secondary', textAlign: 'right' }}>
                    {new Date(trade.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <br />
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{new Date(trade.openedAt).toLocaleDateString()}</span>
                </Typography>
            </Paper>
        </motion.div>
    );
};

export default TradeItem;
