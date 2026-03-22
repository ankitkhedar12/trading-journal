import React from 'react';
import { Box, Typography } from '@mui/material';

import type { CustomTooltipProps } from '../../types/chart';

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isPositive = data.tradePnl >= 0;

        return (
            <Box className="glass-effect" sx={{
                p: 2,
                borderRadius: '15px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                minWidth: 150
            }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    {data.fullDate || data.date}
                </Typography>
                <Box sx={{ pt: 1, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>{data.symbol || 'Trade'}</Typography>
                        <Typography variant="body2" sx={{
                            fontWeight: 'bold',
                            color: isPositive ? 'success.main' : 'error.main'
                        }}>
                            {isPositive ? '+' : ''}${data.tradePnl?.toFixed(2) || '0.00'}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    }
    return null;
};

export default CustomTooltip;
