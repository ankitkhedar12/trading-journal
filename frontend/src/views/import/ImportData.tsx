import { useState, useRef } from 'react';
import { Box, Typography, Paper, CircularProgress, ToggleButton, ToggleButtonGroup, Alert } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';
import { PostAdd } from '@mui/icons-material';
import Papa from 'papaparse';
import { useAuth } from '../../context/AuthContextType';
import { useNavigate } from 'react-router-dom';
import { getBaseUrl } from '../../utils/config';
import { useInvalidateTrades } from '../../hooks/useTradeQueries';
import { validateFile, getSecureHeaders } from '../../utils/security';

import { BROKERS } from '../../constants/common';

const BROKER_LABELS: Record<string, string> = {
    [BROKERS.VANTAGE]: 'Vantage',
    [BROKERS.THE_FUNDED_ROOM]: 'The Funded Room',
};

const ImportData = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedBroker, setSelectedBroker] = useState<string>(BROKERS.VANTAGE);
    const [fileError, setFileError] = useState<string | null>(null);
    const dropControls = useAnimation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const invalidateTrades = useInvalidateTrades();

    const parseVantageTrades = (rawData: Record<string, string>[]) => {
        return rawData.map((row) => {
            if (!row || typeof row !== 'object') return null;

            const get = (key: string) => {
                const target = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                const foundKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === target);
                return foundKey ? String(row[foundKey]) : '';
            };

            return {
                symbol: get('Symbol').replace(/[\r\n\s]+/g, ''),
                volume: get('ClosedTotalVolLots') || get('Volume') || get('Vol'),
                entryPrice: parseFloat(get('EntryPrice').replace(/,/g, '') || '0'),
                closePrice: parseFloat(get('AvgPrice') || get('ClosePrice') || '0'.replace(/,/g, '')),
                pnl: parseFloat(get('PnL') || get('Profit') || '0'.replace(/,/g, '')),
                netPnl: parseFloat(get('NetPnL') || get('PnL') || '0'.replace(/,/g, '')),
                chargesSwap: get('ChargesSwap') || get('Swap') || '0.00',
                openedAt: get('Opened') || get('OpenTime') || get('Time'),
                closedAt: get('Closed') || get('CloseTime') || get('Time'),
                orderId: get('Order') || get('Ticket') || get('Position'),
                status: get('Status') || 'Closed',
                side: get('Symbol').toUpperCase().startsWith('S') ? 'Short' : 'Long'
            };
        }).filter(t => t && t.orderId && t.openedAt);
    };

    const parseFundedRoomTrades = (rawData: Record<string, string>[]) => {
        return rawData.map((row) => {
            if (!row || typeof row !== 'object') return null;

            const get = (key: string) => {
                const target = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                const foundKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === target);
                return foundKey ? String(row[foundKey]).trim() : '';
            };

            const closedRaw = get('CLOSED') || get('CLOSED↓');
            const pair = get('PAIR').replace(/\//g, '');
            const lotSize = get('LOTSIZE') || get('LOT SIZE');
            const entryPrice = get('ENTRYPRICE') || get('ENTRY PRICE');
            const exitPrice = get('EXITPRICE') || get('EXIT PRICE');
            const totalFees = get('TOTALFEES') || get('TOTAL FEES');
            const grossPnl = get('GROSSPL') || get('GROSS P&L') || get('GROSSP&L');
            const netPnl = get('NETPL') || get('NET P&L') || get('NETP&L');

            if (!closedRaw || !pair) return null;

            let isoDate = null;
            try {
                const cleanDateStr = closedRaw.replace(/GMT/g, '').replace(/,/g, '');
                const d = new Date(cleanDateStr);
                if (!isNaN(d.getTime())) {
                    isoDate = d.toISOString();
                }
            } catch {
                // skip invalid dates
            }

            if (!isoDate) return null;

            const orderId = `TFR_${pair}_${isoDate.replace(/[-:T.Z]/g, '')}`;

            return {
                symbol: pair,
                volume: lotSize,
                entryPrice: parseFloat(entryPrice.replace(/[$,]/g, '') || '0'),
                closePrice: parseFloat(exitPrice.replace(/[$,]/g, '') || '0'),
                pnl: parseFloat(grossPnl.replace(/[$,]/g, '') || '0'),
                netPnl: parseFloat(netPnl.replace(/[$,]/g, '') || '0'),
                chargesSwap: totalFees.replace(/[$]/g, '') || '0.00',
                openedAt: isoDate,
                closedAt: isoDate,
                orderId,
                status: 'Closed',
                side: get('SIDE').toUpperCase() === 'SHORT' ? 'Short' : 'Long'
            };
        }).filter(t => t && t.orderId && t.openedAt);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file security
        const validationError = validateFile(file);
        if (validationError) {
            setFileError(validationError);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setFileError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const buffer = event.target?.result as ArrayBuffer;

                const decoderUtf16 = new TextDecoder('utf-16le');
                const decoderUtf8 = new TextDecoder('utf-8');

                let text = decoderUtf16.decode(buffer);

                if (text.indexOf('\t') === -1 && text.indexOf(',') === -1) {
                    text = decoderUtf8.decode(buffer);
                }

                text = text.replace(/\0/g, '');

                const firstLines = text.split('\n').slice(0, 5).join('\n');
                const detectedDelimiter = (firstLines.match(/\t/g)?.length || 0) > (firstLines.match(/,/g)?.length || 0) ? '\t' : ',';

                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    delimiter: detectedDelimiter,
                    complete: async (results) => {
                        try {
                            setIsProcessing(true);

                            const rawData = results.data as Record<string, string>[];

                            if (!rawData || !Array.isArray(rawData)) {
                                setIsProcessing(false);
                                return;
                            }

                            const formattedTrades = selectedBroker === BROKERS.VANTAGE
                                ? parseVantageTrades(rawData)
                                : parseFundedRoomTrades(rawData);

                            if (formattedTrades.length === 0) {
                                setFileError('No valid trades found in the file. Please check the CSV format.');
                                setIsProcessing(false);
                                return;
                            }

                            const res = await fetch(`${getBaseUrl()}/api/trades/import`, {
                                method: 'POST',
                                headers: getSecureHeaders(user?.token),
                                body: JSON.stringify({
                                    trades: formattedTrades,
                                    broker: selectedBroker,
                                })
                            });

                            if (res.ok) {
                                invalidateTrades();
                                navigate('/reports');
                            } else {
                                setFileError('Failed to upload trades. Please try again.');
                                setIsProcessing(false);
                            }
                        } catch {
                            setFileError('An error occurred while processing the file.');
                            setIsProcessing(false);
                        }
                    }
                });
            } catch {
                setFileError('Failed to read the file. Please try a different file.');
                setIsProcessing(false);
            }
        };

        reader.readAsArrayBuffer(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Box className="import-page" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: '100%', maxWidth: '800px' }}
            >
                {fileError && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: '15px' }} onClose={() => setFileError(null)}>
                        {fileError}
                    </Alert>
                )}

                <Paper className="glass-effect" sx={{ p: 5, borderRadius: '40px', mb: 4 }}>
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <Typography variant="h3" fontWeight="bold" gutterBottom>
                            Import Your Trades
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            Upload your MT4/MT5 or CSV report to sync your trades
                        </Typography>
                    </Box>

                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                        Select Broker / Firm
                    </Typography>
                    <ToggleButtonGroup
                        value={selectedBroker}
                        exclusive
                        onChange={(_, val) => { if (val) setSelectedBroker(val); }}
                        fullWidth
                        sx={{
                            gap: 2,
                            display: 'flex',
                            flexWrap: 'wrap',
                            '& .MuiToggleButton-root': {
                                flex: 1,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                py: 2,
                                borderRadius: '15px !important',
                                border: '1px solid !important',
                                borderColor: 'divider',
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    borderColor: 'primary.main',
                                    '&:hover': { bgcolor: 'primary.dark' },
                                },
                            },
                        }}
                    >
                        {Object.keys(BROKER_LABELS).map(key => (
                            <ToggleButton key={key} value={key}>
                                {BROKER_LABELS[key]}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Paper>

                <Paper
                    className={`glass-effect drop-zone ${isHovered ? 'drop-zone--hovered' : 'drop-zone--default'}`}
                    sx={{
                        p: 10,
                        borderRadius: '40px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: '2px dashed',
                        borderColor: isHovered ? 'primary.main' : 'rgba(255,255,255,0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.05)' }
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={triggerFileInput}
                >
                    {!isProcessing && (
                        <motion.div
                            animate={dropControls}
                            whileHover={{ y: -10 }}
                            style={{ display: 'inline-block' }}
                        >
                            <Box sx={{
                                bgcolor: 'success.main',
                                p: 3,
                                borderRadius: '20px',
                                color: 'white',
                                mb: 2,
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                boxShadow: '0 8px 16px rgba(76, 175, 80, 0.4)'
                            }}>
                                <PostAdd sx={{ fontSize: 40 }} />
                                <Typography variant="caption" sx={{ fontWeight: 'bold', mt: 1 }}>trades_export.csv</Typography>
                            </Box>
                        </motion.div>
                    )}

                    {isProcessing ? (
                        <Box sx={{ py: 2 }}>
                            <CircularProgress size={60} sx={{ mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Parsing and Uploading Data...</Typography>
                        </Box>
                    ) : (
                        <>
                            <Typography variant="h5" color="text.primary" fontWeight="bold">
                                Click to select {BROKER_LABELS[selectedBroker]} CSV file
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                                Or drag and drop it here (max 10MB)
                            </Typography>
                        </>
                    )}

                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />
                </Paper>
            </motion.div>
        </Box>
    );
};

export default ImportData;
