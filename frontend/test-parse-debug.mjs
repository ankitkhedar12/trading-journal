import fs from 'fs';
import Papa from 'papaparse';

const fileBuf = fs.readFileSync('src/assets/trades.csv');
// MT5 often has UCS-2 LE BOM. Let's cast it directly.
let text = fileBuf.toString('utf8');
text = text.replace(/\0/g, '');

const detectedDelimiter = '\t';
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    delimiter: detectedDelimiter,
                    complete: async (results) => {
                        const rawData = results.data;
                        const formattedTrades = rawData.map((row) => {
                            const get = (key) => {
                                const target = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                                const foundKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === target);
                                return foundKey ? String(row[foundKey]) : '';
                            };
                            return {
                                orderId: get('Order') || get('Ticket') || get('Position'),
                                openedAt: get('Opened') || get('OpenTime') || get('Time'),
                            };
                        });
                        console.log("Mapped payload BEFORE filter:", formattedTrades);
                    }
                });
