import fs from 'fs';
import Papa from 'papaparse';

const fileBuf = fs.readFileSync('../Trading_Journal - Sheet1.csv');

const decoderUtf16 = new TextDecoder('utf-16le');
const decoderUtf8 = new TextDecoder('utf-8');

let text = decoderUtf16.decode(fileBuf);

if (text.indexOf('\t') === -1 && text.indexOf(',') === -1) {
    text = decoderUtf8.decode(fileBuf);
}

text = text.replace(/\0/g, '');

const detectedDelimiter = ',';

Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: detectedDelimiter,
    complete: (results) => {
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
                closedAt: get('Closed') || get('CloseTime') || get('Time'),
                orderId: get('Order') || get('Ticket') || get('Position'),
            };
        }).filter(t => t.orderId && t.openedAt);
        
        console.log(formattedTrades.find(t => t.orderId === '#416519448'));
    }
});
