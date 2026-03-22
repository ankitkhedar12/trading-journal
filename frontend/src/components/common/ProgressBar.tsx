import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

import type { ProgressBarProps } from '../../types/common';

const ProgressBar: React.FC<ProgressBarProps> = ({
    label,
    current,
    max,
    isGood,
    isCurrency = true
}) => {
    const theme = useTheme();
    const pct = Math.min((current / max) * 100, 100);
    const nearLimit = pct > 0 && !isGood ? pct > 85 : false;

    let barColor = isGood ? theme.palette.success.main : theme.palette.warning.main;
    if (nearLimit || (pct >= 100 && !isGood)) {
        barColor = theme.palette.error.main;
    }

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1
            }}>
                <Typography variant="body2" color="text.secondary">
                    {label}
                </Typography>
                <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={nearLimit ? 'error.main' : 'text.primary'}
                >
                    {isCurrency
                        ? `$${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : current
                    } / {isCurrency
                        ? `$${max.toLocaleString()}`
                        : max
                    } ({pct.toFixed(1)}%)
                </Typography>
            </Box>
            <Box sx={{
                height: 8,
                width: '100%',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                overflow: 'hidden'
            }}>
                <Box
                    component={motion.div}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    sx={{
                        height: '100%',
                        bgcolor: pct > 0 ? barColor : 'transparent',
                        boxShadow: pct > 0 ? `0 0 15px ${barColor}66` : 'none',
                        borderRadius: '10px',
                    }}
                />
            </Box>
        </Box>
    );
};

export default ProgressBar;
