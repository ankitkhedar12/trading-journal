import { Paper } from '@mui/material';
import { motion, type HTMLMotionProps } from 'framer-motion';
import React from 'react';

const MotionPaper = motion(Paper);

interface FloatingCardProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode;
    delay?: number;
    sx?: any;
}

const FloatingCard: React.FC<FloatingCardProps> = ({ children, delay = 0, sx = {}, ...props }) => (
    <MotionPaper
        className="glass-effect"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
        whileHover={{ scale: 1.01, zIndex: 10, transition: { duration: 0.3, ease: 'easeOut' } }}
        sx={{
            p: { xs: 2.5, sm: 4, md: 5 },
            borderRadius: { xs: '30px', md: '40px' },
            position: 'relative',
            overflow: 'hidden',
            height: '100%',
            ...sx
        }}
        {...props}
    >
        {children}
    </MotionPaper>
);

export default FloatingCard;
