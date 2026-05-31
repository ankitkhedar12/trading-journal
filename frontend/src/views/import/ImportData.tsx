import { useState, useRef, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Select, MenuItem } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';
import { PostAdd } from '@mui/icons-material';
import Papa from 'papaparse';
import { useAuth } from '../../context/AuthContextType';
import { useNavigate } from 'react-router-dom';
import { getBaseUrl } from '../../utils/config';
import { useInvalidateTrades, usePropAccounts } from '../../hooks/useTradeQueries';
import { validateFile, getSecureHeaders } from '../../utils/security';
import { buildTradesFromOrders } from '../../utils/tradeImportUtils';

import { BROKERS } from '../../constants/common';

const BROKER_LABELS: Record<string, string> = {
    [BROKERS.VANTAGE]: 'Vantage',
    [BROKERS.THE_FUNDED_ROOM]: 'The Funded Room',
};

const ImportData = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedBroker] = useState<string>(BROKERS.VANTAGE);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [fileError, setFileError] = useState<string | null>(null);
    const dropControls = useAnimation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const invalidateTrades = useInvalidateTrades();
    const { data: propAccounts = [] } = usePropAccounts();

    const vantageAccounts = useMemo(() => {
        return propAccounts.filter(acc => acc.firmName === 'Vantage');
    }, [propAccounts]);

    useEffect(() => {
        if (vantageAccounts.length > 0) {
            if (!selectedAccountId || !vantageAccounts.find(a => a.id === selectedAccountId)) {
                setSelectedAccountId(vantageAccounts[0].id);
            }
        } else {
            setSelectedAccountId('');
        }
    }, [vantageAccounts, selectedAccountId]);

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
        const reconstructedTrades = buildTradesFromOrders(rawData);
        
        return reconstructedTrades.filter(t => t.exitLot > 0).map((t) => {
            let isoClosedDate = null;
            let isoOpenedDate = null;

            try {
                const cleanOpenedStr = t.entryTime.replace(/GMT/g, '').replace(/,/g, '');
                const dOpened = new Date(cleanOpenedStr);
                if (!isNaN(dOpened.getTime())) {
                    isoOpenedDate = dOpened.toISOString();
                }
            } catch {
                // Ignore parse errors
            }

            try {
                const cleanClosedStr = t.exitTime.replace(/GMT/g, '').replace(/,/g, '');
                const dClosed = new Date(cleanClosedStr);
                if (!isNaN(dClosed.getTime())) {
                    isoClosedDate = dClosed.toISOString();
                }
            } catch {
                // Ignore parse errors
            }

            if (!isoOpenedDate || !isoClosedDate) return null;

            const orderId = `TFR_${t.pair}_${isoClosedDate.replace(/[-:T.Z]/g, '')}`;

            // PnL Estimation based on reconstructed lot sizes and prices
            let pnlRaw = (t.avgExitPrice - t.avgEntryPrice) * t.entryLot;
            if (t.direction === 'Short') {
                pnlRaw = (t.avgEntryPrice - t.avgExitPrice) * t.entryLot;
            }
            
            // Standard multiplier estimation
            const pairUpper = t.pair.toUpperCase();
            let multiplier = 100000; // default for forex

            const CRYPTOS = ['BTC', 'ETH', 'SOL', 'DOGE', 'LTC', 'XRP', 'ADA', 'DOT', 'LINK', 'BCH'];
            const INDICES = ['US30', 'NAS', 'US100', 'SPX', 'GER30', 'UK100', 'FRA40', 'JPN225', 'AUS200', 'HK50'];

            if (CRYPTOS.some(c => pairUpper.includes(c))) multiplier = 1;
            else if (INDICES.some(i => pairUpper.includes(i))) multiplier = 1;
            else if (pairUpper.includes('XAU')) multiplier = 100;
            else if (pairUpper.includes('XAG')) multiplier = 5000;
            else if (pairUpper.includes('WTI') || pairUpper.includes('USOIL') || pairUpper.includes('UKOIL')) multiplier = 1000;

            pnlRaw *= multiplier;

            // Convert PnL to USD if quote currency is not USD
            let quoteCurrency = 'USD';
            if (pairUpper.includes('/')) {
                quoteCurrency = pairUpper.split('/')[1].trim();
            } else if (pairUpper.length >= 6) {
                quoteCurrency = pairUpper.substring(pairUpper.length - 3);
            }

            if (quoteCurrency !== 'USD') {
                if (pairUpper.startsWith('USD/') || (pairUpper.length === 6 && pairUpper.startsWith('USD'))) {
                    // Exact conversion using the exit price (which is the quote/USD rate)
                    pnlRaw /= (t.avgExitPrice || 1);
                } else {
                    // Approximate conversion for cross pairs (e.g. EUR/JPY, GBP/CHF)
                    const approxUSDExchangeRates: Record<string, number> = {
                        'JPY': 150,     // 1 USD approx 150 JPY
                        'CHF': 0.9,     // 1 USD approx 0.9 CHF
                        'CAD': 1.35,    // 1 USD approx 1.35 CAD
                        'AUD': 1.5,     // 1 USD approx 1.5 AUD
                        'NZD': 1.6,     // 1 USD approx 1.6 NZD
                        'GBP': 0.8,     // 1 USD approx 0.8 GBP
                        'EUR': 0.92,    // 1 USD approx 0.92 EUR
                        'KRW': 1350,    // 1 USD approx 1350 KRW
                        'MXN': 17,      // 1 USD approx 17 MXN
                        'ZAR': 18,      // 1 USD approx 18 ZAR
                        'TRY': 32       // 1 USD approx 32 TRY
                    };
                    const rate = approxUSDExchangeRates[quoteCurrency];
                    if (rate) {
                        pnlRaw /= rate;
                    }
                }
            }

            return {
                symbol: t.pair,
                volume: t.entryLot.toFixed(2),
                entryPrice: parseFloat(t.avgEntryPrice.toFixed(5)),
                closePrice: parseFloat(t.avgExitPrice.toFixed(5)),
                pnl: parseFloat(pnlRaw.toFixed(2)),
                netPnl: parseFloat(pnlRaw.toFixed(2)),
                chargesSwap: '0.00',
                openedAt: isoOpenedDate,
                closedAt: isoClosedDate,
                orderId,
                status: 'Closed',
                side: t.direction
            };
        }).filter(t => t !== null);
    };

    const parseMT5HtmlReport = (htmlStr: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlStr, 'text/html');
        const rows = doc.querySelectorAll('tr');
        const trades: Record<string, any>[] = [];

        let inPositionsSection = false;

        rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).filter(c => !c.classList.contains('hidden'));
            
            // Check if we entered the Positions section
            const thB = row.querySelector('th b')?.textContent;
            if (thB === 'Positions' || thB === 'Closed Transactions') {
                inPositionsSection = true;
                return;
            }
            if (thB === 'Orders' || thB === 'Deals' || thB === 'Open Positions') {
                inPositionsSection = false;
                return;
            }

            if (inPositionsSection && cells.length >= 13) {
                // Potential trade row
                const timeOpenStr = cells[0]?.textContent?.trim();
                // Match "YYYY.MM.DD HH:MM:SS"
                if (timeOpenStr && /^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}$/.test(timeOpenStr)) {
                    // Extract fields
                    const orderId = cells[1]?.textContent?.trim();
                    const symbol = cells[2]?.textContent?.trim();
                    const type = cells[3]?.textContent?.trim();
                    const volume = cells[4]?.textContent?.trim();
                    const priceOpen = cells[5]?.textContent?.trim();
                    const timeCloseStr = cells[8]?.textContent?.trim();
                    const priceClose = cells[9]?.textContent?.trim();
                    const commission = cells[10]?.textContent?.trim();
                    const swap = cells[11]?.textContent?.trim();
                    const profit = cells[12]?.textContent?.trim();

                    if (orderId && timeCloseStr && timeCloseStr !== 'cancelled') { // only closed trades
                        trades.push({
                            symbol: symbol?.replace(/[\r\n\s]+/g, ''),
                            volume: volume,
                            entryPrice: parseFloat(priceOpen?.replace(/,/g, '') || '0'),
                            closePrice: parseFloat(priceClose?.replace(/,/g, '') || '0'),
                            pnl: parseFloat(profit?.replace(/,/g, '') || '0'),
                            netPnl: parseFloat(profit?.replace(/,/g, '') || '0') + parseFloat(commission?.replace(/,/g, '') || '0') + parseFloat(swap?.replace(/,/g, '') || '0'),
                            chargesSwap: `${commission}/${swap}`,
                            openedAt: timeOpenStr,
                            closedAt: timeCloseStr,
                            orderId: orderId,
                            status: 'Closed',
                            side: type?.toLowerCase() === 'sell' ? 'Short' : 'Long'
                        });
                    }
                }
            }
        });

        return trades;
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

                if (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')) {
                    setIsProcessing(true);
                    const formattedTrades = parseMT5HtmlReport(text);

                    if (formattedTrades.length === 0) {
                        setFileError('No valid trades found in the HTML file. Please check the MT5 report format.');
                        setIsProcessing(false);
                        return;
                    }

                    fetch(`${getBaseUrl()}/api/trades/import`, {
                        method: 'POST',
                        headers: getSecureHeaders(user?.token),
                        body: JSON.stringify({
                            trades: formattedTrades,
                            broker: selectedBroker,
                            propAccountId: selectedAccountId || undefined
                        })
                    }).then(async res => {
                        if (res.ok) {
                            const data = await res.json();
                            const count = data.count || 0;
                            invalidateTrades();
                            if (count === 0) {
                                setFileError(data.message || 'All trades in this file were already imported.');
                                setIsProcessing(false);
                            } else {
                                navigate('/reports');
                            }
                        } else {
                            setFileError('Failed to upload trades. Please try again.');
                            setIsProcessing(false);
                        }
                    }).catch(() => {
                        setFileError('An error occurred while processing the file.');
                        setIsProcessing(false);
                    });
                    
                    return;
                }

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
                                    propAccountId: selectedAccountId || undefined
                                })
                            });

                            if (res.ok) {
                                const data = await res.json();
                                const count = data.count || 0;
                                invalidateTrades();
                                if (count === 0) {
                                    setFileError(data.message || 'All trades in this file were already imported.');
                                    setIsProcessing(false);
                                } else {
                                    navigate('/reports');
                                }
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
        if (!selectedAccountId || vantageAccounts.length === 0) {
            setFileError('Please select or create a Vantage account first.');
            return;
        }
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

                    <Box sx={{ mt: 2, textAlign: 'left' }}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                            Select Vantage Account
                        </Typography>
                        {vantageAccounts.length === 0 ? (
                            <Alert severity="warning" sx={{ borderRadius: '15px' }}>
                                You haven't created any Vantage accounts yet. Please go to the Dashboard to set one up first.
                            </Alert>
                        ) : (
                            <Select
                                fullWidth
                                value={selectedAccountId}
                                onChange={(e) => setSelectedAccountId(e.target.value as string)}
                                sx={{ borderRadius: '15px' }}
                            >
                                {vantageAccounts.map(acc => (
                                    <MenuItem key={acc.id} value={acc.id}>
                                        Vantage ({acc.accountType}) - Starting Balance: ${acc.accountSize.toLocaleString()}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    </Box>
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
                        accept=".csv,.html,.htm,.xlsx"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                        disabled={!selectedAccountId || vantageAccounts.length === 0}
                    />
                </Paper>
            </motion.div>
        </Box>
    );
};

export default ImportData;
