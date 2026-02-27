curl -X POST http://localhost:3000/api/trades/import \
  -H "Content-Type: application/json" \
  -d '[
  {
    "symbol": "XAUUSD.tv",
    "volume": "0.05/0.05",
    "entryPrice": 5061.63,
    "closePrice": 5056.52,
    "pnl": 25.55,
    "netPnl": 25.55,
    "chargesSwap": "0.00/0.00",
    "openedAt": "20/02/2026 19:18:44",
    "closedAt": "20/02/2026 19:21:04",
    "orderId": "#421082424",
    "status": "Closed"
  }
]'
