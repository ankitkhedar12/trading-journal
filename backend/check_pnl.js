const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const trades = await prisma.trade.findMany({
        where: { broker: 'vantage' }
    });
    
    let sumPnl = 0;
    let sumNetPnl = 0;
    trades.forEach(t => {
        sumPnl += t.pnl;
        sumNetPnl += t.netPnl;
    });
    console.log(`Total Trades: ${trades.length}`);
    console.log(`Sum PnL: ${sumPnl}`);
    console.log(`Sum Net PnL: ${sumNetPnl}`);
}

check().then(() => process.exit());
