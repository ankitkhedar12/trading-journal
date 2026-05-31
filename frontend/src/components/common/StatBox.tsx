import React from 'react';
import { Box, Typography } from '@mui/material';

interface StatBoxProps {
    title: string;
    value: string | number;
    subtext?: string;
    color?: string;
}

const StatBox: React.FC<StatBoxProps> = ({ title, value, subtext, color = "text.primary" }) => (
    <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" fontWeight="600" textTransform="uppercase" letterSpacing={1}>
            {title}
        </Typography>
        <Typography variant="h4" fontWeight="bold" sx={{ color, mt: 0.5, textShadow: color !== 'text.primary' ? `0 0 20px ${color}40` : 'none' }}>
            {value}
        </Typography>
        {subtext && <Typography variant="caption" color="text.secondary">{subtext}</Typography>}
    </Box>
);

export default StatBox;
