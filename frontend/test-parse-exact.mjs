import Papa from 'papaparse';
const csv = `SymbolClosed/Total Vol. (Lots)Entry PriceAvg.PricePnLNet PnLCharges/SwapOpenedClosedOrderStatus
"S
XAUUSD.tv"0.05/0.055,061.635,056.5225.5525.550.00/0.0020/02/2026 19:18:4420/02/2026 19:21:04#421082424Closed
"S
XAUUSD.tv"0.04/0.045,065.415,065.250.640.640.00/0.0020/02/2026 19:00:2520/02/2026 19:00:53#421075739Closed`;

                Papa.parse(csv, {
                    header: true,
                    skipEmptyLines: true,
                    delimiter: '\t',
                    complete: async (results) => {
                        const rawData = results.data;
                        const formattedTrades = rawData.map((row) => {
                            const get = (key) => {
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
                        }).filter(t => t.orderId && t.openedAt);
                        console.log("Extracted length:", formattedTrades.length);
                        console.log("Payload:", formattedTrades);
                    }
                });
