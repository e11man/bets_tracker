-- Sample data for the new day trade structure
-- This shows how day trades will be stored as single entries

-- Example day trades using the new structure
INSERT INTO stocks_new (
  symbol, 
  company_name, 
  trade_type, 
  quantity, 
  buy_price, 
  sell_price, 
  buy_total, 
  sell_total, 
  profit_loss, 
  profit_loss_percentage, 
  trade_date, 
  buy_time, 
  sell_time, 
  notes
) VALUES
-- SPRC day trade (3 shares bought at $4.14, sold at $4.22)
('SPRC', 'Spruce Power Holding Corp', 'day_trade', 3, 4.14, 4.22, 12.42, 12.66, 0.24, 1.93, '2025-09-17', '09:30:00', '15:45:00', 'Day trade - 1.93% profit'),

-- ORCL day trade (1 share bought at $333, sold at $335)
('ORCL', 'Oracle Corporation', 'day_trade', 1, 333.00, 335.00, 333.00, 335.00, 2.00, 0.60, '2025-09-10', '10:15:00', '14:30:00', 'Day trade - 0.6% profit'),

-- TSLA day trade (2 shares bought at $349.62, sold at $350.39)
('TSLA', 'Tesla Inc', 'day_trade', 2, 349.62, 350.39, 699.24, 700.78, 1.54, 0.22, '2025-09-09', '09:45:00', '11:20:00', 'Day trade - 0.22% profit'),

-- ORCL day trade #2 (2 shares bought at $324.86, sold at $326.56)
('ORCL', 'Oracle Corporation', 'day_trade', 2, 324.86, 326.56, 649.72, 653.12, 3.40, 0.52, '2025-09-09', '13:00:00', '16:00:00', 'Day trade - 0.52% profit'),

-- AVGO day trade (1 share bought at $346.89, sold at $349.4)
('AVGO', 'Broadcom Inc', 'day_trade', 1, 346.89, 349.40, 346.89, 349.40, 2.51, 0.72, '2025-09-07', '10:00:00', '15:30:00', 'Day trade - 0.72% profit'),

-- AMD day trade (1 share bought at $154.03, sold at $154.57)
('AMD', 'Advanced Micro Devices Inc', 'day_trade', 1, 154.03, 154.57, 154.03, 154.57, 0.54, 0.35, '2025-09-05', '09:30:00', '12:45:00', 'Day trade - 0.35% profit'),

-- AEO day trade (4 shares bought at $17.49, sold at $17.81)
('AEO', 'American Eagle Outfitters Inc', 'day_trade', 4, 17.49, 17.81, 69.96, 71.24, 1.28, 1.83, '2025-09-04', '09:30:00', '14:15:00', 'Day trade - 1.83% profit');

-- Example of buy-only trade
INSERT INTO stocks_new (
  symbol, 
  company_name, 
  trade_type, 
  quantity, 
  buy_price, 
  buy_total, 
  trade_date, 
  buy_time, 
  notes
) VALUES
('AAPL', 'Apple Inc', 'buy_only', 5, 150.00, 750.00, '2025-09-22', '10:00:00', 'Long term hold');

-- Example of sell-only trade
INSERT INTO stocks_new (
  symbol, 
  company_name, 
  trade_type, 
  quantity, 
  sell_price, 
  sell_total, 
  trade_date, 
  sell_time, 
  notes
) VALUES
('MSFT', 'Microsoft Corporation', 'sell_only', 3, 400.00, 1200.00, '2025-09-22', '14:30:00', 'Taking profits');

-- Verify the data
SELECT 
  symbol,
  company_name,
  trade_type,
  quantity,
  buy_price,
  sell_price,
  profit_loss,
  profit_loss_percentage,
  trade_date,
  buy_time,
  sell_time
FROM stocks_new 
ORDER BY trade_date DESC, created_at ASC;

-- Summary statistics
SELECT 
  trade_type,
  COUNT(*) as count,
  SUM(profit_loss) as total_profit_loss,
  AVG(profit_loss_percentage) as avg_profit_percentage
FROM stocks_new 
GROUP BY trade_type;
