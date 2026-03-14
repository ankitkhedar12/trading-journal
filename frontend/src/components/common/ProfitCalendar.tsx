import React from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarMonth } from '@mui/icons-material';
import { useThemeContext } from '../../context/ThemeContextType';

import type { ProfitCalendarProps } from '../../types/common';

const ProfitCalendar: React.FC<ProfitCalendarProps> = ({
    currentDate,
    onDateChange,
    data,
    title = "Trading Session Calendar",
    onDayClick
}) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const { mode } = useThemeContext();

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarMonth sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold' }}>{title}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => onDateChange(subMonths(currentDate, 1))}><ChevronLeft /></IconButton>
                    <Typography variant="body1" sx={{ minWidth: 120, textAlign: 'center', alignSelf: 'center', color: 'text.secondary' }}>
                        {format(currentDate, 'MMMM yyyy')}
                    </Typography>
                    <IconButton size="small" onClick={() => onDateChange(addMonths(currentDate, 1))}><ChevronRight /></IconButton>
                </Box>
            </Box>

            <Box className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <Box key={day} className="calendar-day-header" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {day}
                    </Box>
                ))}

                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <Box key={`empty-${i}`} />
                ))}

                {daysInMonth.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const tradeStats = data[dateStr];
                    const hasTrades = !!tradeStats;
                    const pnl = tradeStats ? tradeStats.pnl : 0;
                    const count = tradeStats ? tradeStats.count : 0;
                    const isPositive = pnl > 0;

                    return (
                        <Box
                            key={i}
                            sx={{ position: 'relative', zIndex: 1, '&:hover': { zIndex: 10 } }}
                            onClick={() => hasTrades && onDayClick?.(day)}
                        >
                            <motion.div
                                whileHover={hasTrades ? { scale: 1.05, y: -5, transition: { duration: 0.2, ease: "easeOut" } } : {}}
                                whileTap={hasTrades ? { scale: 0.95 } : {}}
                            >
                                <Paper
                                    elevation={hasTrades ? 8 : 1}
                                    className={`calendar-day ${hasTrades ? 'calendar-day--has-trades' : 'calendar-day--no-trades'}`}
                                    sx={{
                                        bgcolor: hasTrades ? (isPositive ? mode == "dark" ? 'rgba(0, 255, 8, 0.2)' : 'rgba(76, 175, 80, 0.15)' : mode == "dark" ? 'rgba(255, 38, 0, 0.3)' : 'rgba(255, 38, 0, 0.15)') : 'background.paper',
                                        color: hasTrades ? 'white' : 'text.disabled',
                                        borderColor: hasTrades ? (isPositive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)') : 'divider',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden', // Keep cell content contained
                                        borderRadius: '25px'
                                    }}
                                >
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: mode === "dark" ? "white" : 'text.secondary' }}>
                                        {format(day, 'MMM d')}
                                    </Typography>

                                    {hasTrades && (
                                        <Box>
                                            <Typography
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: isPositive ? mode === "dark" ? "rgba(0, 255, 8, 1)" : 'green' : mode === "dark" ? "rgba(255, 38, 0, 1)" : 'red',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    fontSize: '1rem',
                                                    mb: 0.3
                                                }}
                                            >
                                                {isPositive ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '0.65rem', display: 'block', mt: -0.2, color: mode === "dark" ? "white" : 'text.secondary' }}>
                                                {count} Trades
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </motion.div>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default ProfitCalendar;
