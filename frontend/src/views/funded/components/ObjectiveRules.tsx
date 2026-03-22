import React from 'react';
import { Box, Typography } from '@mui/material';
import { Gavel, Warning } from '@mui/icons-material';
import FloatingCard from '../../../components/common/FloatingCard';
import ProgressBar from '../../../components/common/ProgressBar';

import type { ObjectiveRulesProps } from '../../../types/account';

const ObjectiveRules: React.FC<ObjectiveRulesProps> = ({ rules }) => {
    return (
        <FloatingCard delay={0.1} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Typography variant="h6" mb={4} display="flex" alignItems="center">
                <Gavel sx={{ mr: 1 }} /> Objective Rules
            </Typography>
            <Box sx={{ flex: 1 }}>
                <ProgressBar label="Daily Drawdown (Static)" current={rules.dailyDrawdown.current} max={rules.dailyDrawdown.limit} isGood={false} />
                <ProgressBar label="Max Total Drawdown" current={rules.maxDrawdown.current} max={rules.maxDrawdown.limit} isGood={false} />
                {rules.profitTarget?.isActive && (
                    <ProgressBar label="Profit Target" current={rules.profitTarget.current} max={rules.profitTarget.limit} isGood={true} />
                )}
                {rules.minDays?.limit !== undefined && rules.minDays.limit > 0 && (
                    <Box>
                        <ProgressBar label="Min Trading Days" current={rules.minDays.current} max={rules.minDays.limit} isGood={true} isCurrency={false} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -1.5, mb: 1.5, fontSize: '0.65rem', fontStyle: 'italic', opacity: 0.8 }}>
                            * Only days with ±0.25% balance movement count
                        </Typography>
                    </Box>
                )}
                {rules.maxRisk?.isActive && (
                    <ProgressBar label="Max 3% Aggregated Risk" current={rules.maxRisk.currentPct ?? 0} max={100} isGood={false} isCurrency={false} />
                )}

                {rules.consistency?.isActive && (
                    <Box className="consistency-rule-box">
                        <Typography variant="caption" color="secondary.main" display="flex" alignItems="center" fontWeight="bold">
                            <Warning sx={{ fontSize: 16, mr: 0.5 }} /> Consistency Rule (15%)
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold', color: (rules.consistency.currentPct ?? 0) > 15 ? 'error.main' : 'text.primary' }}>
                            Best Day: {(rules.consistency.currentPct ?? 0).toFixed(1)}% of TP
                        </Typography>
                    </Box>
                )}
            </Box>
        </FloatingCard>
    );
};

export default ObjectiveRules;
