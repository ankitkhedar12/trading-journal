//+------------------------------------------------------------------+
//|                                             TradingJournal_EA.mq5 |
//|                                                                  |
//| Sends closed trades to a webhook for Trading Journal             |
//+------------------------------------------------------------------+
#property copyright "Trading Journal"
#property link      ""
#property version   "1.00"

input string WebhookURL = "https://trading-journal-02po.onrender.com/api/trades/webhook";
input string AccountID = "PASTE_YOUR_VANTAGE_ACCOUNT_ID_HERE"; // The ID from your trading journal dashboard

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   Print("TradingJournal EA Initialized. Listening for trades...");
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| TradeTransaction function                                        |
//| Fires when a trade transaction occurs                            |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
  {
   // We only care about deals that are executed
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
     {
      // Select the deal
      if(HistoryDealSelect(trans.deal))
        {
         long dealEntry = HistoryDealGetInteger(trans.deal, DEAL_ENTRY);
         // We only want deals that close a position (DEAL_ENTRY_OUT)
         if(dealEntry == DEAL_ENTRY_OUT || dealEntry == DEAL_ENTRY_OUT_BY)
           {
            SendTradeToWebhook(trans.deal);
           }
        }
     }
  }

//+------------------------------------------------------------------+
//| Sends trade data to webhook                                      |
//+------------------------------------------------------------------+
void SendTradeToWebhook(ulong dealTicket)
  {
   string symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
   double volume = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
   double price = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
   double profit = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
   double commission = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
   double swap = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
   long closeTime = HistoryDealGetInteger(dealTicket, DEAL_TIME);
   long positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
   long type = HistoryDealGetInteger(dealTicket, DEAL_TYPE);

   // To find entry price, we need to find the deal that opened the position
   double entryPrice = 0.0;
   long openTime = 0;
   
   HistorySelectByPosition(positionId);
   int totalDeals = HistoryDealsTotal();
   for(int i = 0; i < totalDeals; i++)
     {
      ulong dTicket = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(dTicket, DEAL_ENTRY) == DEAL_ENTRY_IN)
        {
         entryPrice = HistoryDealGetDouble(dTicket, DEAL_PRICE);
         openTime = HistoryDealGetInteger(dTicket, DEAL_TIME);
         break;
        }
     }

   string side = (type == DEAL_TYPE_BUY) ? "Short" : "Long"; // Closing a Buy means it was a Short position, wait, DEAL_TYPE is the deal type. If closing deal is BUY, position was SHORT. If closing deal is SELL, position was LONG.
   
   // Format JSON
   string json = "{";
   json += "\"accountId\":\"" + AccountID + "\",";
   json += "\"orderId\":\"" + IntegerToString(positionId) + "\",";
   json += "\"symbol\":\"" + symbol + "\",";
   json += "\"volume\":" + DoubleToString(volume, 2) + ",";
   json += "\"entryPrice\":" + DoubleToString(entryPrice, 5) + ",";
   json += "\"closePrice\":" + DoubleToString(price, 5) + ",";
   json += "\"pnl\":" + DoubleToString(profit, 2) + ",";
   json += "\"commission\":" + DoubleToString(commission, 2) + ",";
   json += "\"swap\":" + DoubleToString(swap, 2) + ",";
   json += "\"openTime\":" + IntegerToString(openTime) + ",";
   json += "\"closeTime\":" + IntegerToString(closeTime) + ",";
   json += "\"side\":\"" + side + "\"";
   json += "}";

   char post[], result[];
   StringToCharArray(json, post, 0, WHOLE_ARRAY, CP_UTF8);
   
   string headers = "Content-Type: application/json\r\n";
   string resultHeaders;
   
   // Increased timeout to 60000ms (60 seconds) so it doesn't time out while Render wakes up
   int res = WebRequest("POST", WebhookURL, headers, 60000, post, result, resultHeaders);
   
   if(res == 200 || res == 201)
     {
      Print("Trade successfully sent to webhook. Position: ", positionId);
     }
   else
     {
      Print("Failed to send trade. Error code: ", GetLastError(), " WebRequest res: ", res);
     }
  }
