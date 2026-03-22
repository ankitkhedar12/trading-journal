import type { ReconstructedTrade } from '../types/trade';

/**
 * Reconstructs trades from individual orders (MT5 history format).
 * Handles partial exits, multiple scaling entries, and reverse trades.
 */
export const buildTradesFromOrders = (orders: Record<string, string>[]): ReconstructedTrade[] => {
    const getVal = (order: Record<string, string>, key: string) => {
        const target = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const found = Object.keys(order).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === target);
        return found ? String(order[found]).trim() : '';
    };

    const filled = orders.filter(o => getVal(o, 'Status').toLowerCase() === 'filled');

    filled.sort((a, b) => {
        const dateA = new Date(getVal(a, 'Date').replace(/GMT/g, '').replace(/,/g, '')).getTime();
        const dateB = new Date(getVal(b, 'Date').replace(/GMT/g, '').replace(/,/g, '')).getTime();
        return dateA - dateB;
    });

    const byPair: Record<string, Record<string, string>[]> = {};
    filled.forEach(o => {
        const pair = getVal(o, 'Pair').replace(/\//g, '');
        if (!byPair[pair]) byPair[pair] = [];
        byPair[pair].push(o);
    });

    const finalTrades: any[] = [];

    Object.keys(byPair).forEach(pair => {
        let position = 0;
        let currentTrade: any = null;

        byPair[pair].forEach(order => {
            const side = getVal(order, 'Side').toLowerCase();
            const lot = parseFloat(getVal(order, 'LotSize') || '0');
            const qty = side === 'buy' ? lot : -lot;
            
            if (position === 0) {
                position += qty;
                currentTrade = {
                    pair,
                    direction: qty > 0 ? 'Long' : 'Short',
                    entryOrders: [{...order, matchedLot: lot}],
                    exitOrders: [],
                };
            } else {
                const isSameDirection = (position > 0 && qty > 0) || (position < 0 && qty < 0);
                
                if (isSameDirection) {
                    position += qty;
                    currentTrade.entryOrders.push({...order, matchedLot: lot});
                } else {
                    const absPos = Math.abs(position);
                    const absQty = Math.abs(qty);
                    const remainingAbs = Math.abs(absQty - absPos) < 0.00001 ? 0 : absQty - absPos;

                    if (remainingAbs <= 0) {
                        currentTrade.exitOrders.push({...order, matchedLot: absQty});
                        position += qty;

                        if (Math.abs(position) < 0.00001) {
                            position = 0;
                            finalTrades.push(currentTrade);
                            currentTrade = null;
                        }
                    } else {
                        currentTrade.exitOrders.push({...order, matchedLot: absPos});
                        finalTrades.push(currentTrade);
                        
                        position += qty; 
                        currentTrade = {
                            pair,
                            direction: position > 0 ? 'Long' : 'Short',
                            entryOrders: [{...order, matchedLot: remainingAbs}],
                            exitOrders: [],
                        };
                    }
                }
            }
        });
    });

    return finalTrades.map(trade => {
        const entryLot = trade.entryOrders.reduce((sum: number, o: any) => sum + o.matchedLot, 0);
        const exitLot = trade.exitOrders.reduce((sum: number, o: any) => sum + o.matchedLot, 0);

        let avgEntry = 0;
        if (entryLot > 0) {
            avgEntry = trade.entryOrders.reduce((sum: number, o: any) => sum + (parseFloat(getVal(o, 'Price') || '0') * o.matchedLot), 0) / entryLot;
        }

        let avgExit = 0;
        if (exitLot > 0) {
            avgExit = trade.exitOrders.reduce((sum: number, o: any) => sum + (parseFloat(getVal(o, 'Price') || '0') * o.matchedLot), 0) / exitLot;
        }

        const entryTime = getVal(trade.entryOrders[0], 'Date');
        const exitTime = trade.exitOrders.length > 0 ? getVal(trade.exitOrders[trade.exitOrders.length - 1], 'Date') : entryTime;

        return {
            pair: trade.pair,
            direction: trade.direction,
            entryTime,
            exitTime,
            entryOrders: trade.entryOrders,
            exitOrders: trade.exitOrders,
            entryLot,
            exitLot,
            avgEntryPrice: avgEntry,
            avgExitPrice: avgExit
        };
    });
};
