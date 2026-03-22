import React from 'react';
import { Paper, Typography } from '@mui/material';

import type { AccountStatsCardProps } from '../../types/common';

const AccountStatsCard: React.FC<AccountStatsCardProps> = ({ label, value, color, bg }) => {
    return (
        <Paper sx={{ p: 2, borderRadius: '30px', bgcolor: bg, border: 'none' }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="h5" color={color} fontWeight="bold">{value}</Typography>
        </Paper>
    );
};

export default AccountStatsCard;
