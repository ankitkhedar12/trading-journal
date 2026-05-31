import { Box, Typography } from '@mui/material';
import { useThemeContext } from '../../context/ThemeContextType';

const CustomScatterTooltip = ({ active, payload }: any) => {
    const { mode } = useThemeContext();
    const isDark = mode === 'dark';

    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const color = data.pnl >= 0 ? '#10b981' : '#ef4444';
        return (
            <Box sx={{ background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', p: 2, borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                <Typography color="text.secondary" variant="caption">Trade Data</Typography>
                <Typography fontWeight="bold" sx={{ color }}>PnL: ${Number(data.pnl).toFixed(2)}</Typography>
                {data.volume && <Typography variant="body2" color="text.primary">Lots: {data.volume}</Typography>}
                {data.durationMinutes !== undefined && <Typography variant="body2" color="text.primary">Duration: {Number(data.durationMinutes).toFixed(0)}m</Typography>}
            </Box>
        );
    }
    return null;
};

export default CustomScatterTooltip;
