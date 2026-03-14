import React from 'react';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import FloatingCard from '../../../components/common/FloatingCard';
import AccountStatsCard from '../../../components/common/AccountStatsCard';

import type { AccountMatrixProps } from '../../../types/account';

const AccountMatrix: React.FC<AccountMatrixProps> = ({ metrics, currentDate, totalTradesThisMonth }) => {
    const stats = [
        { 
            label: 'Current P&L', 
            val: `${metrics.totalPnl >= 0 ? '+' : ''}$${Math.abs(metrics.totalPnl).toFixed(2)}`, 
            color: metrics.totalPnl >= 0 ? 'success.main' : 'error.main', 
            bg: metrics.totalPnl >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' 
        },
        { 
            label: `Trades (${format(currentDate, 'MMM')})`, 
            val: totalTradesThisMonth, 
            color: 'info.main', 
            bg: 'rgba(33, 150, 243, 0.1)' 
        },
        { 
            label: 'Win Rate', 
            val: metrics.winRate, 
            color: 'success.main', 
            bg: 'rgba(76, 175, 80, 0.1)' 
        },
        { 
            label: 'Win/Loss Days', 
            val: `${metrics.totalWinDays}W / ${metrics.totalLossDays}L`, 
            color: 'text.primary', 
            bg: 'rgba(255, 255, 255, 0.03)' 
        },
        { 
            label: 'Trading Days', 
            val: metrics.tradingDays, 
            color: 'primary.main', 
            bg: 'rgba(156, 39, 176, 0.1)' 
        },
    ];

    return (
        <FloatingCard delay={0.4} sx={{ flexGrow: 1, width: '100%' }}>
            <Typography variant="h6" mb={3}>Account Matrix</Typography>
            <Box className="account-stats-list" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stats.map((stat, i) => (
                    <AccountStatsCard 
                        key={i}
                        label={stat.label}
                        value={stat.val}
                        color={stat.color}
                        bg={stat.bg}
                    />
                ))}
            </Box>
        </FloatingCard>
    );
};

export default AccountMatrix;
