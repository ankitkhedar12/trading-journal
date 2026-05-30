import re

with open('ReportHistory-28315610.html', 'r', encoding='utf-16le') as f:
    content = f.read()

# find all trs
trs = re.findall(r'<tr[^>]*>(.*?)</tr>', content, re.DOTALL | re.IGNORECASE)

in_positions = False
trades = []

for tr in trs:
    th = re.search(r'<th[^>]*>.*?<b>(.*?)</b>', tr, re.DOTALL | re.IGNORECASE)
    if th:
        text = th.group(1).strip()
        if text in ['Positions', 'Closed Transactions']:
            in_positions = True
            continue
        elif text in ['Orders', 'Deals', 'Open Positions']:
            in_positions = False
            continue

    if in_positions:
        # get all tds
        tds = re.findall(r'<td([^>]*)>(.*?)</td>', tr, re.DOTALL | re.IGNORECASE)
        # filter out hidden
        tds = [td for td in tds if 'class="hidden"' not in td[0]]
        
        if len(tds) >= 13:
            time_open = re.sub(r'<[^>]*>', '', tds[0][1]).strip()
            if re.match(r'^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}$', time_open):
                order_id = re.sub(r'<[^>]*>', '', tds[1][1]).strip()
                time_close = re.sub(r'<[^>]*>', '', tds[8][1]).strip()
                profit = re.sub(r'<[^>]*>', '', tds[12][1]).strip()
                commission = re.sub(r'<[^>]*>', '', tds[10][1]).strip()
                swap = re.sub(r'<[^>]*>', '', tds[11][1]).strip()
                
                if order_id and time_close and time_close != 'cancelled':
                    trades.append({
                        'profit': float(profit.replace(',', '') or 0),
                        'commission': float(commission.replace(',', '') or 0),
                        'swap': float(swap.replace(',', '') or 0)
                    })

total = sum([t['profit'] + t['commission'] + t['swap'] for t in trades])
print(f"Total PnL from Positions: {total}")
print(f"Number of trades: {len(trades)}")

