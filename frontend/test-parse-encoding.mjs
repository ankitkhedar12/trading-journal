import fs from 'fs';
import Papa from 'papaparse';

function parseBuffer(buf) {
    let text = buf.toString('utf16le');
    // Simple heuristic: if utf16 text looks like garbage (no basic ascii), fallback to utf8
    if (text.indexOf('\t') === -1 && text.indexOf(',') === -1) {
       text = buf.toString('utf8');
    }
    
    text = text.replace(/\0/g, '');

    const firstLines = text.split('\n').slice(0, 5).join('\n');
    const detectedDelimiter = (firstLines.match(/\t/g)?.length || 0) > (firstLines.match(/,/g)?.length || 0) ? '\t' : ',';
    
    console.log("Delimiter detected:", detectedDelimiter === '\t' ? '[TAB]' : '[COMMA]');

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
                    symbol: get('Symbol').replace(/[\r\n\s]+/g, ''),
                    openedAt: get('Opened') || get('OpenTime') || get('Time'),
                    orderId: get('Order') || get('Ticket') || get('Position'),
                };
            }).filter(t => t.orderId && t.openedAt);
            
            console.log("Extracted:", formattedTrades.length);
        }
    });
}

// 1. the manual tab string representation (utf8)
console.log("--- UTF8 String Test ---");
const strUtf8 = `Symbol\tClosed/Total Vol. (Lots)\tEntry Price\tAvg.Price\tPnL\tNet PnL\tCharges/Swap\tOpened\tClosed\tOrder\tStatus
"S
XAUUSD.tv"\t0.05/0.05\t5,061.63\t5,056.52\t25.55\t25.55\t0.00/0.00\t20/02/2026 19:18:44\t20/02/2026 19:21:04\t#421082424\tClosed`;
parseBuffer(Buffer.from(strUtf8, 'utf8'));

// 2. pseudo MT5 format (utf16le BOM with null chars)
console.log("\n--- UTF16 String Test ---");
const strUtf16 = Buffer.from('\uFEFF' + strUtf8, 'utf16le');
parseBuffer(strUtf16);

