import React from 'react';
import { Paper, type PaperProps } from '@mui/material';
import { motion } from 'framer-motion';

export interface GlassCardProps extends PaperProps {
    isDark?: boolean;
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const GlassCard: React.FC<GlassCardProps> = ({ children, isDark, sx = {}, ...props }) => (
    <Paper
        component={motion.div}
        variants={itemVariants}
        sx={{
            p: 3,
            borderRadius: '24px',
            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
            backdropFilter: 'blur(20px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
            height: '100%',
            ...sx
        }}
        {...(props as any)}
    >
        {children}
    </Paper>
);

export default GlassCard;
