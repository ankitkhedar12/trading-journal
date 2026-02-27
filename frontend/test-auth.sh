token=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ankitkhedar12@gmail.com","password":"Test@123"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -s -X POST http://localhost:3000/api/trades/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d '[
  {
    "symbol": "SBTCUSD",
    "volume": "0.03/0.03",
    "entryPrice": 70798.34,
    "closePrice": 70,
    "pnl": -1.32,
    "netPnl": -1.32,
    "chargesSwap": "0.00/0.00",
    "openedAt": "2026.02.24 15:30:00",
    "closedAt": "24.02.2026 15:30:00",
    "orderId": "#416519455",
    "status": "Closed"
  }
]' -w "\nHTTP Status: %{http_code}\n"
