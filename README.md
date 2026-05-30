# Trading Journal - Prop Firm Edition

A professional trading journal designed for prop firm traders (specifically "The Funded Room"). It automatically reconstructs trades from MT5 order histories and monitors for HFT/Hedging violations.

## 🚀 Core Features

- **Trade Reconstruction**: Converts raw TheFundedRoom execution orders into consolidated trades.
- **Auto-Deduplication**: Intelligently skips already imported trades using synthetic IDs.
- **Violation Monitoring**: Detects HFT (High-Frequency Trading) and Hedging as per prop firm rules.
- **Performance Analytics**: Visualizes PnL, Win Rate, and Drawdown.

---

## 📊 Trade Reconstruction Logic (`buildTradesFromOrders`)

Since MT5 histories contain individual *orders*, not consolidated *trades*, the system uses a custom algorithm to reconstruct your activity:

### 1. The Rules
- **Filled Only**: Ignores any orders with status != "filled".
- **Chronological Processing**: Orders are sorted by time (Oldest → Newest).
- **Lot Balance Tracking**:
  - `Buy` adds to the balance (e.g., +0.10 lots).
  - `Sell` subtracts from the balance (e.g., -0.10 lots).
- **Trade Boundaries**:
  - **Start**: When position lot balance moves from `0` to `non-zero`.
  - **Exit**: When position returns to exactly `0`.

### 2. Complex Scenarios Handled
- **Scaling In/Out**: Properly calculates weighted `avgEntryPrice` and `avgExitPrice` across multiple executions.
- **Partial Exits**: Tracks remaining lot balance until the trade is fully flat.
- **Reverse Trades**: If an order flips a position (e.g., going from +0.5 Buy to -0.5 Sell), the system automatically:
  1. Closes the first trade (Long).
  2. Opens a new trade (Short) with the remaining lot size.

---

## 🛠️ Data Integrity & Deduplication

To prevent duplicate trades when you re-upload your full history CSV:

- **Synthetic ID**: Each trade is assigned an `orderId` formatted as:
  `TFR_{Symbol}_{ISO_Exit_Time}`
- **Close-Targeting**: We use the **Exit Time** as the unique fingerprint. This ensures that even if you re-upload the same file, the backend will identify the trade has already been stored and skip it.
- **Batch Processing**: The backend uses high-performance bulk operations (`createMany`) to "top up" your journal with only the newest trades.

---

## ⚖️ Prop Firm Rules (Violations)

### HFT (High-Frequency Trading)
- **Rule**: 4 or more filled orders in the **same direction** on the **same asset** within **3 minutes**.
- **Action**: First offense results in a warning; second offense results in account failure.

### Hedging
- **Rule**: Opening both a Buy and a Sell on the same asset simultaneously (or with overlapping durations).

---

## 📂 Project Structure

- `/frontend`: React + Vite + TypeScript (Trade reconstruction logic happens here).
- `/backend`: NestJS + Prisma + PostgreSQL (Deduplication and persistence happens here).

## 🛠️ Getting Started

1. Clone the repository.
2. Run `npm install` in both `/frontend` and `/backend`.
3. Set up your `.env` for database connection.
4. Use `npm run dev` (frontend) and `npm run start:dev` (backend).
