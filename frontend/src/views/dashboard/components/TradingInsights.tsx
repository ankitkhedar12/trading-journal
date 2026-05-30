import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { Analytics, TrendingUp, TrendingDown, Toll, Security } from '@mui/icons-material';
import FloatingCard from '../../../components/common/FloatingCard';

import type { AccountMetrics } from '../../../types/account';

interface TradingInsightsProps {
    metrics: AccountMetrics;
}

const TradingInsights: React.FC<TradingInsightsProps> = ({ metrics }) => {
    const rr = metrics.riskRewardRatio ?? 0;
    const pf = metrics.profitFactor ?? 0;
    const best = metrics.bestTrade ?? 0;
    const worst = metrics.worstTrade ?? 0;

    // Determine visual colors/interpretations for RR
    let rrColor = 'error.main';
    let rrText = 'Poor';
    if (rr >= 2.0) {
        rrColor = 'success.main';
        rrText = 'Excellent';
    } else if (rr >= 1.0) {
        rrColor = 'info.main';
        rrText = 'Good';
    }

    // Determine visual colors/interpretations for Profit Factor
    let pfColor = 'error.main';
    let pfText = 'Unprofitable';
    if (pf >= 2.0) {
        pfColor = 'success.main';
        pfText = 'Highly Profitable';
    } else if (pf >= 1.0) {
        pfColor = 'info.main';
        pfText = 'Profitable';
    }

    return (
        <FloatingCard delay={0.1} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Typography variant="h6" mb={3} display="flex" alignItems="center">
                <Analytics sx={{ mr: 1, color: 'primary.main' }} /> Trading Insights
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
                
                {/* Risk Reward Ratio */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="bold">
                            Risk Reward Ratio (RR)
                        </Typography>
                        <Typography variant="caption" sx={{ color: rrColor, fontWeight: 'bold' }}>
                            {rrText}
                        </Typography>
                    </Box>
                    <Box sx={{ 
                        p: 2, 
                        borderRadius: '15px', 
                        bgcolor: 'rgba(33, 150, 243, 0.05)', 
                        border: '1px solid rgba(33, 150, 243, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Typography variant="h4" color="primary.main" fontWeight="bold">
                            {rr > 0 ? `${rr.toFixed(2)}:1` : '0.00'}
                        </Typography>
                        <Toll sx={{ color: rrColor, fontSize: 24 }} />
                    </Box>
                </Box>

                {/* Profit Factor */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="bold">
                            Profit Factor
                        </Typography>
                        <Typography variant="caption" sx={{ color: pfColor, fontWeight: 'bold' }}>
                            {pfText}
                        </Typography>
                    </Box>
                    <Box sx={{ 
                        p: 2, 
                        borderRadius: '15px', 
                        bgcolor: 'rgba(156, 39, 176, 0.05)', 
                        border: '1px solid rgba(156, 39, 176, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Typography variant="h4" color="secondary.main" fontWeight="bold">
                            {pf > 0 ? pf.toFixed(2) : '0.00'}
                        </Typography>
                        <Security sx={{ color: pfColor, fontSize: 24 }} />
                    </Box>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                {/* Best & Worst Trades */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                            Best Trade
                        </Typography>
                        <Box sx={{ 
                            p: 1.5, 
                            borderRadius: '12px', 
                            bgcolor: 'rgba(76, 175, 80, 0.08)', 
                            border: '1px solid rgba(76, 175, 80, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <TrendingUp sx={{ color: 'success.main' }} />
                            <Typography variant="subtitle1" color="success.main" fontWeight="bold">
                                {best >= 0 ? `+$${best.toFixed(2)}` : `$${best.toFixed(2)}`}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                            Worst Trade
                        </Typography>
                        <Box sx={{ 
                            p: 1.5, 
                            borderRadius: '12px', 
                            bgcolor: 'rgba(244, 67, 54, 0.08)', 
                            border: '1px solid rgba(244, 67, 54, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <TrendingDown sx={{ color: 'error.main' }} />
                            <Typography variant="subtitle1" color="error.main" fontWeight="bold">
                                {worst < 0 ? `-$${Math.abs(worst).toFixed(2)}` : `$${worst.toFixed(2)}`}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </FloatingCard>
    );
};

export default TradingInsights;
