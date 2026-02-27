import Papa from 'papaparse';

const csv = `Symbol\tClosed/Total Vol. (Lots)\tEntry Price\tAvg.Price\tPnL\tNet PnL\tCharges/Swap\tOpened\tClosed\tOrder\tStatus
"S
XAUUSD.tv"\t0.05/0.05\t5,061.63\t5,056.52\t25.55\t25.55\t0.00/0.00\t20/02/2026 19:18:44\t20/02/2026 19:21:04\t#421082424\tClosed
"S
XAUUSD.tv"\t0.04/0.04\t5,065.41\t5,065.25\t0.64\t0.64\t0.00/0.00\t20/02/2026 19:00:25\t20/02/2026 19:00:53\t#421075739\tClosed`;

console.log("Raw CSV:\n", csv);

Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    delimiter: '\t',
    complete: (results) => {
        console.log("Parsed rows:", results.data.length);
        console.log("First row keys:", Object.keys(results.data[0]));
        console.log("First row raw:", results.data[0]);
    }
});
