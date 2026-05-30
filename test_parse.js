const fs = require('fs');
const { JSDOM } = require('jsdom');

const htmlStr = fs.readFileSync('ReportHistory-28315610.html', 'utf-16le');
const dom = new JSDOM(htmlStr);
const doc = dom.window.document;
const rows = doc.querySelectorAll('tr');
const trades = [];

let inPositionsSection = false;

rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td')).filter(c => !c.classList.contains('hidden'));
    
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
        const timeOpenStr = cells[0]?.textContent?.trim();
        if (timeOpenStr && /^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}$/.test(timeOpenStr)) {
            const orderId = cells[1]?.textContent?.trim();
            const symbol = cells[2]?.textContent?.trim();
            const type = cells[3]?.textContent?.trim();
            const volume = cells[4]?.textContent?.trim();
            const priceOpen = cells[5]?.textContent?.trim();
            const sl = cells[6]?.textContent?.trim();
            const tp = cells[7]?.textContent?.trim();
            const timeCloseStr = cells[8]?.textContent?.trim();
            const priceClose = cells[9]?.textContent?.trim();
            const commission = cells[10]?.textContent?.trim();
            const swap = cells[11]?.textContent?.trim();
            const profit = cells[12]?.textContent?.trim();

            if (orderId && timeCloseStr && timeCloseStr !== 'cancelled') {
                trades.push({
                    orderId,
                    profit: parseFloat(profit?.replace(/,/g, '') || '0'),
                    commission: parseFloat(commission?.replace(/,/g, '') || '0'),
                    swap: parseFloat(swap?.replace(/,/g, '') || '0')
                });
            }
        }
    }
});

let totalPnl = 0;
trades.forEach(t => {
    totalPnl += t.profit + t.commission + t.swap;
});
console.log('Parsed trades count:', trades.length);
console.log('Total PnL:', totalPnl);
