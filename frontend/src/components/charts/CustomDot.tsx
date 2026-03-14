import React from 'react';
import { motion } from 'framer-motion';

import type { CustomDotProps } from '../../types/chart';

const CustomDot: React.FC<CustomDotProps> = (props) => {
    const { cx, cy, index = 0 } = props;
    return (
        <motion.circle
            cx={cx}
            cy={cy}
            r={6}
            fill="#2196f3"
            stroke="#fff"
            strokeWidth={2}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.6, ease: "easeOut" }}
            style={{ filter: 'drop-shadow(0 0 8px rgba(33, 150, 243, 0.8))' }}
        />
    );
};

export default CustomDot;
