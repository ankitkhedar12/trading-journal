import { useState, useRef } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';
import { PostAdd } from '@mui/icons-material';
import Papa from 'papaparse';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getBaseUrl } from '../utils/config';



const ImportData = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const dropControls = useAnimation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const buffer = event.target?.result as ArrayBuffer;

                    // Read the bytes directly to handle potential UTF-16 (often from MT5) vs UTF-8
                    const decoderUtf16 = new TextDecoder('utf-16le');
                    const decoderUtf8 = new TextDecoder('utf-8');

                    let text = decoderUtf16.decode(buffer);

                    // A quick heuristic: if reading as UTF-16 yields absolute garbage with no commas or tabs, 
                    // it's extremely likely the file is actually standard UTF-8.
                    if (text.indexOf('\t') === -1 && text.indexOf(',') === -1) {
                        text = decoderUtf8.decode(buffer);
                    }

                    // MT5 adds invisible null bytes, which we still need to sanitize
                    text = text.replace(/\0/g, '');

                    // Detect delimiter dynamically: if first few lines have more tabs than commas, use tab.
                    const firstLines = text.split('\n').slice(0, 5).join('\n');
                    const detectedDelimiter = (firstLines.match(/\t/g)?.length || 0) > (firstLines.match(/,/g)?.length || 0) ? '\t' : ',';

                    Papa.parse(text, {
                        header: true,
                        skipEmptyLines: true,
                        delimiter: detectedDelimiter,
                        complete: async (results) => {
                            try {
                                setIsProcessing(true);

                                const rawData = results.data as any[];

                                if (!rawData || !Array.isArray(rawData)) {
                                    console.error("CSV returned no array data.");
                                    setIsProcessing(false);
                                    return;
                                }

                                const formattedTrades = rawData.map((row: any) => {
                                    if (!row || typeof row !== 'object') return null;

                                    // Fuzzy match to fix trailing whitespace or invisible chars in headers
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
                                        status: get('Status') || 'Closed'
                                    };
                                }).filter(t => t && t.orderId && t.openedAt);

                                console.log("Extracted Trades to send:", formattedTrades.length);

                                if (formattedTrades.length === 0) {
                                    console.error("No trades matched the extraction format.");
                                    setIsProcessing(false);
                                    return;
                                }

                                const res = await fetch(`${getBaseUrl()}/api/trades/import`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${user?.token}`
                                    },
                                    body: JSON.stringify(formattedTrades)
                                });

                                if (res.ok) {
                                    navigate('/reports');
                                } else {
                                    console.error('API call failed:', res.statusText);
                                    setIsProcessing(false);
                                }
                            } catch (err) {
                                console.error('Fatal parsing error:', err);
                                setIsProcessing(false);
                            }
                        }
                    });
                } catch (readErr) {
                    console.error("FileReader onload fatal error:", readErr);
                    setIsProcessing(false);
                }
            };

            // Read as ArrayBuffer so we can definitively control text decoding strategies (UTF-16 vs UTF-8)
            reader.readAsArrayBuffer(file);

            // Allow re-uploading the same file
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Box sx={{ flex: '1 1 40%', minWidth: 300 }}>
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                >
                    <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Import Data</Typography>

                    <Paper
                        className="glass-effect"
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            borderRadius: 4,
                            border: isHovered ? '2px dashed #2196f3' : '2px dashed rgba(150, 150, 150, 0.3)',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onClick={triggerFileInput}
                    >
                        {/* CSV File Icon that Drops */}
                        {!isProcessing && (
                            <motion.div
                                animate={dropControls}
                                whileHover={{ y: -10 }}
                                style={{ display: 'inline-block' }}
                            >
                                <Box sx={{
                                    bgcolor: 'success.main',
                                    borderRadius: 2,
                                    p: 3,
                                    display: 'inline-flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    mb: 2,
                                    boxShadow: '0 8px 16px rgba(76, 175, 80, 0.4)'
                                }}
                                >
                                    <PostAdd fontSize="large" sx={{ mb: 1 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>trades_export.csv</Typography>
                                </Box>
                            </motion.div>
                        )}

                        <Typography variant="h6" color="text.primary">
                            Click to select CSV file and import trades
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Matches standard export format
                        </Typography>

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

            <Box sx={{ flex: '1 1 50%', minWidth: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ textAlign: 'center' }}
                    >
                        <CircularProgress size={60} sx={{ mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Parsing and Uploading Data...</Typography>
                        <Typography variant="body2" color="text.secondary">Please wait while your trades are imported.</Typography>
                    </motion.div>
                )}
            </Box>
        </Box>
    );
};

export default ImportData;
