const Papa = require('papaparse');
const csv = `SymbolClosed/Total Vol. (Lots)Entry PriceAvg.PricePnLNet PnLCharges/SwapOpenedClosedOrderStatus
"S
XAUUSD.tv"0.05/0.055,061.635,056.5225.5525.550.00/0.0020/02/2026 19:18:4420/02/2026 19:21:04#421082424Closed
"S
XAUUSD.tv"0.04/0.045,065.415,065.250.640.640.00/0.0020/02/2026 19:00:2520/02/2026 19:00:53#421075739Closed`;

Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    delimiter: '\t',
    complete: (results) => {
        console.log("Parsed rows:", results.data.length);
        console.log("First row:", results.data[0]);
    }
});
