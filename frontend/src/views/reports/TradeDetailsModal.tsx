import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, TextField, Rating,
    Chip, Divider, IconButton, Grid, Paper, Autocomplete
} from '@mui/material';
import { Close } from '@mui/icons-material';

import { useThemeContext } from '../../context/ThemeContextType';
import { useUpdateTrade } from '../../hooks/useTradeQueries';
import type { Trade } from '../../types/trade';

interface TradeDetailsModalProps {
    open: boolean;
    onClose: () => void;
    trade: Trade | null;
}

const COMMON_TAGS = ['Trend Following', 'Reversal', 'Breakout', 'News', 'FOMO', 'Revenge Trade', 'Followed Plan', 'Missed Entry', 'Overleveraged'];
const COMMON_STRATEGIES = ['Supply & Demand', 'ICT/SMC', 'Support & Resistance', 'Moving Average Crossover', 'Price Action', 'Liquidity'];

const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({ open, onClose, trade }) => {
    const { mode } = useThemeContext();
    const isDark = mode === 'dark';
    const { mutate: updateTrade, isPending } = useUpdateTrade();

    const [notes, setNotes] = useState('');
    const [rating, setRating] = useState<number | null>(0);
    const [tags, setTags] = useState<string[]>([]);
    const [strategy, setStrategy] = useState<string>('');
    const [takeProfit, setTakeProfit] = useState<string>('');
    const [stopLoss, setStopLoss] = useState<string>('');

    useEffect(() => {
        if (trade) {
            setNotes(trade.notes || '');
            setRating(trade.rating || 0);
            setTags(trade.tags || []);
            setStrategy(trade.strategy || '');
            setTakeProfit(trade.takeProfit?.toString() || '');
            setStopLoss(trade.stopLoss?.toString() || '');
        }
    }, [trade]);

    if (!trade) return null;

    const handleSave = () => {
        updateTrade({
            tradeId: trade.id,
            data: {
                notes,
                rating: rating || undefined,
                tags,
                strategy,
                takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
                stopLoss: stopLoss ? parseFloat(stopLoss) : undefined
            }
        }, {
            onSuccess: () => onClose()
        });
    };

    const isWin = trade.pnl > 0;
    const pnlColor = isWin ? '#4caf50' : trade.pnl < 0 ? '#f44336' : 'text.secondary';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: isDark ? '#1a1a1a' : '#ffffff',
                    borderRadius: '20px',
                    backgroundImage: 'none',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold">
                        {trade.symbol} <span style={{ fontSize: '1rem', color: '#888', fontWeight: 'normal' }}>({trade.side || 'Trade'})</span>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(trade.openedAt).toLocaleString()} - {new Date(trade.closedAt).toLocaleString()}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <Divider />

            <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={4}>
                    {/* Left Column: Stats & Setup */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 2, borderRadius: '15px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', mb: 3 }} elevation={0}>
                            <Typography variant="subtitle2" color="text.secondary" mb={2}>Trade Execution</Typography>

                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2">Net P&L</Typography>
                                <Typography variant="body2" fontWeight="bold" color={pnlColor}>
                                    ${trade.pnl.toFixed(2)}
                                </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2">Volume (Lots)</Typography>
                                <Typography variant="body2">{trade.volume}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2">Entry Price</Typography>
                                <Typography variant="body2">{trade.entryPrice}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2">Close Price</Typography>
                                <Typography variant="body2">{trade.closePrice}</Typography>
                            </Box>
                        </Paper>

                        <Typography variant="subtitle2" color="text.secondary" mb={1}>Trade Setup</Typography>
                        <Box mb={2}>
                            <Typography variant="caption" color="text.secondary">Trade Rating</Typography>
                            <Box>
                                <Rating
                                    value={rating}
                                    onChange={(_, newValue) => setRating(newValue)}
                                />
                            </Box>
                        </Box>

                        <Autocomplete
                            freeSolo
                            options={COMMON_STRATEGIES}
                            value={strategy}
                            onChange={(_, newValue) => setStrategy(newValue || '')}
                            onInputChange={(_, newInputValue) => setStrategy(newInputValue)}
                            renderInput={(params) => <TextField {...params} label="Strategy" variant="outlined" size="small" fullWidth margin="dense" />}
                            sx={{ mb: 2 }}
                        />

                        <Grid container spacing={2} mb={2}>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Take Profit"
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    type="number"
                                    value={takeProfit}
                                    onChange={(e) => setTakeProfit(e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Stop Loss"
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    type="number"
                                    value={stopLoss}
                                    onChange={(e) => setStopLoss(e.target.value)}
                                />
                            </Grid>
                        </Grid>

                        <Autocomplete
                            multiple
                            freeSolo
                            options={COMMON_TAGS}
                            value={tags}
                            onChange={(_, newValue) => setTags(newValue as string[])}
                            renderTags={(value: readonly string[], getTagProps) =>
                                value.map((option: string, index: number) => {
                                    const { key, ...restProps } = getTagProps({ index });
                                    return <Chip variant="outlined" label={option} size="small" key={key} {...restProps} sx={{ mr: 0.5, mt: 0.5 }} />;
                                })
                            }
                            renderInput={(params) => (
                                <TextField {...params} variant="outlined" label="Tags" placeholder="Add tag..." size="small" />
                            )}
                        />
                    </Grid>

                    {/* Right Column: Rich Text Notes */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Typography variant="subtitle2" color="text.secondary" mb={1}>Trade Notes</Typography>
                        <Box sx={{ height: '400px' }}>
                            <TextField
                                multiline
                                rows={15}
                                fullWidth
                                variant="outlined"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Write down your thoughts, technical analysis, and emotions during this trade..."
                                sx={{
                                    height: '100%',
                                    '& .MuiInputBase-root': {
                                        height: '100%',
                                        alignItems: 'flex-start',
                                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                        borderRadius: '10px'
                                    }
                                }}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <Divider />
            <DialogActions sx={{ p: 2, px: 3 }}>
                <Button onClick={onClose} color="inherit" disabled={isPending}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={isPending}
                    sx={{ borderRadius: '10px', px: 4 }}
                >
                    Save Journal
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TradeDetailsModal;
