import React from 'react';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import type { SortKey, SortOrder } from '../../types/reports';

interface SortIconProps {
    column: SortKey;
    sortKey: SortKey;
    sortOrder: SortOrder;
}

const SortIcon: React.FC<SortIconProps> = ({ column, sortKey, sortOrder }) => {
    if (sortKey !== column) return null;
    return sortOrder === 'asc' ?
        <ArrowUpward sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} /> :
        <ArrowDownward sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />;
};

export default SortIcon;
