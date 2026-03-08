# Funded Account Dashboard Plan

## Overview
This section tracks performance for prop firm accounts (like The Funded Room, FTMO, etc.), giving traders real-time insights into their evaluations or funded stages to ensure they stay within rules.

## 1. Data Models (Database Schema Updates)
We need a new table or an extension to track the `PropAccount`.
* **PropAccount Model:**
  * `id`, `userId` (relation)
  * `firmName` (e.g., "The Funded Room", "FTMO")
  * `accountType` (Enum: `1_STEP`, `2_STEP`, `INSTANT`)
  * `accountSize` (e.g., 5000, 10000, 25000)
  * `status` (Enum: `PHASE_1`, `PHASE_2`, `FUNDED`, `FAILED`)
  * `dailyDrawdownLimit` (Percentage or fixed max loss per day)
  * `maxDrawdownLimit` (Percentage or fixed total max loss)
  * `profitTarget` (Target in currency/percentage, needed if in Phase 1/2)
  * `minTradingDays` (Minimum days required to pass)
  * `createdAt`, `updatedAt`

* **Link Trades to PropAccount:**
  * Alternatively, leverage the existing `broker` field on the `Trade` model to associate trades with this specific prop account.

## 2. User Flows
### A. Account Setup & Management
* **Add Account:** Modal/Form to input Firm Name, Type, Size, Status.
* **Edit/Delete:** User can edit the status (e.g., passed Phase 1 -> move to Phase 2) or delete the account entirely if failed/restarting.

### B. Dashboard Interface
* **Header / Overview:**
  * Current Balance & Equity
  * Account Status (`PHASE 1` - "In Progress")
* **Drawdown Tracking (Critical):**
  * **Daily Drawdown:** visual progress bar (e.g., `$100 / $1,250` allowed today based on start-of-day balance).
  * **Max Drawdown:** visual progress bar (e.g., `$400 / $2,500` max allowed trailing/static).
* **Objectives Tracking (for 1-Step / 2-Step):**
  * **Profit Target:** `$500 / $2,000` (ProgressBar)
  * **Trading Days:** `3 / 5 days` traded.
* **Advanced Statistics (Monthly / Overall):**
  * Month P&L (e.g., +$535.22)
  * Win Days vs Loss Days (e.g., Win: 3, Loss: 2)
  * Win Rate (e.g., 60%)
  * Total Trades (e.g., 34)
  * Consistency Rule (Some firms require no single day to make up >50% of total profit).
* **Visuals:**
  * Equity Curve Chart
  * P&L Calendar (Heatmap style)
  * Trade History Table scoped to this account.

## 3. Implementation Steps
### Backend
1. Create `PropAccount` Prisma schema and migrate.
2. Create `prop-account` module/controller/service.
3. Add endpoints: `POST /`, `GET /`, `PUT /:id`, `DELETE /:id`.
4. Create aggregated stats endpoint: calculates Daily Drawdown (complex logical check based on today's trades), Max Drawdown, and Win/Loss days based on matched trades.

### Frontend
1. Create new top-level route `/prop-dashboard`.
2. **Account Settings Modal:** Create the form to input initial params.
3. **Dashboard Layout:**
   * Top widgets (Balance, Targets, Drawdowns).
   * Middle section: Charts (Equity) and Monthly Stats summary.
   * Bottom section: P&L Calendar & Recent Trades list.

---

## 💡 Suggestions & Missing Features to Consider
While the plan covers the core, prop firms often have tricky hidden rules. Consider adding these:
1. **Consistency Rule Tracker:** Many firms state that one day's profit cannot exceed X% (usually 50% or 30%) of the total profit target. A widget showing the "Best Day %" against this rule would be highly valuable.
2. **Violation Alerts:** UI warnings (color changes to red) if the current floating or closed P&L is getting within 10% of violating the daily or max drawdown.
3. **High Impact News Warning:** Prop firms often ban trading 2 mins before/after high-impact news. An API integration for an economic calendar to flag trades that violated this rule.
4. **Lot Size Tracker:** Some firms have maximum lots limits across all open pairs. A view showing average lot size vs allowed limit.
5. **Payout Request Simulator:** For `FUNDED` status accounts, show a countdown to the first eligible payout date and estimate the split (e.g., 80/20 split projection).
