import { Box, Typography } from '@mui/material';
import { useThemeContext } from '../../context/ThemeContextType';

const CustomBarTooltip = ({ active, payload, label }: any) => {
    const { mode } = useThemeContext();
    const isDark = mode === 'dark';

    if (active && payload && payload.length) {
        return (
            <Box sx={{ background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', p: 2, borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <Typography color="text.secondary" variant="caption">{label}</Typography>
                <Typography fontWeight="bold" color="text.primary">Trades: {payload[0].value}</Typography>
            </Box>
        );
    }
    return null;
};

export default CustomBarTooltip;
