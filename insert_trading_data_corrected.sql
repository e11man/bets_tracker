-- DELETE ALL EXISTING DATA FIRST
DELETE FROM stocks;

-- Reset the sequence to start from 1
ALTER SEQUENCE stocks_id_seq RESTART WITH 1;

-- Insert your EXACT trading data from trades.json
-- Each trade becomes two records: one buy and one sell

-- SPRC trade (3 shares bought at $4.14, sold at $4.22) - $0.24 profit
INSERT INTO stocks (symbol, company_name, action, quantity, price, total_value, trade_date, notes, created_at, updated_at) VALUES
('SPRC', 'Spruce Power Holding Corp', 'buy', 3, 4.14, 12.42, '2025-09-17', 'Day trade - 1.93% profit, $0.24', '2025-09-17T09:30:00Z', NOW()),
('SPRC', 'Spruce Power Holding Corp', 'sell', 3, 4.22, 12.66, '2025-09-17', 'Day trade - 1.93% profit, $0.24', '2025-09-17T15:45:00Z', NOW()),

-- ORCL trade (1 share bought at $333, sold at $335) - $2.00 profit
('ORCL', 'Oracle Corporation', 'buy', 1, 333.00, 333.00, '2025-09-10', 'Day trade - 0.6% profit, $2.00', '2025-09-10T10:15:00Z', NOW()),
('ORCL', 'Oracle Corporation', 'sell', 1, 335.00, 335.00, '2025-09-10', 'Day trade - 0.6% profit, $2.00', '2025-09-10T14:30:00Z', NOW()),

-- TSLA trade (2 shares bought at $349.62, sold at $350.39) - $1.54 profit
('TSLA', 'Tesla Inc', 'buy', 2, 349.62, 699.24, '2025-09-09', 'Day trade - 0.22% profit, $1.54', '2025-09-09T09:45:00Z', NOW()),
('TSLA', 'Tesla Inc', 'sell', 2, 350.39, 700.78, '2025-09-09', 'Day trade - 0.22% profit, $1.54', '2025-09-09T11:20:00Z', NOW()),

-- ORCL trade #2 (2 shares bought at $324.86, sold at $326.56) - $3.40 profit
('ORCL', 'Oracle Corporation', 'buy', 2, 324.86, 649.72, '2025-09-09', 'Day trade - 0.52% profit, $3.40', '2025-09-09T13:00:00Z', NOW()),
('ORCL', 'Oracle Corporation', 'sell', 2, 326.56, 653.12, '2025-09-09', 'Day trade - 0.52% profit, $3.40', '2025-09-09T16:00:00Z', NOW()),

-- AVGO trade (1 share bought at $346.89, sold at $349.4) - $2.51 profit
('AVGO', 'Broadcom Inc', 'buy', 1, 346.89, 346.89, '2025-09-07', 'Day trade - 0.72% profit, $2.51', '2025-09-07T10:00:00Z', NOW()),
('AVGO', 'Broadcom Inc', 'sell', 1, 349.40, 349.40, '2025-09-07', 'Day trade - 0.72% profit, $2.51', '2025-09-07T15:30:00Z', NOW()),

-- AMD trade (1 share bought at $154.03, sold at $154.57) - $0.54 profit
('AMD', 'Advanced Micro Devices Inc', 'buy', 1, 154.03, 154.03, '2025-09-05', 'Day trade - 0.35% profit, $0.54', '2025-09-05T09:30:00Z', NOW()),
('AMD', 'Advanced Micro Devices Inc', 'sell', 1, 154.57, 154.57, '2025-09-05', 'Day trade - 0.35% profit, $0.54', '2025-09-05T12:45:00Z', NOW()),

-- AEO trade (4 shares bought at $17.49, sold at $17.81) - $1.28 profit
('AEO', 'American Eagle Outfitters Inc', 'buy', 4, 17.49, 69.96, '2025-09-04', 'Day trade - 1.83% profit, $1.28', '2025-09-04T09:30:00Z', NOW()),
('AEO', 'American Eagle Outfitters Inc', 'sell', 4, 17.81, 71.24, '2025-09-04', 'Day trade - 1.83% profit, $1.28', '2025-09-04T14:15:00Z', NOW());

-- Verify the data matches your trades.json exactly
SELECT 
  symbol,
  company_name,
  action,
  quantity,
  price,
  total_value,
  trade_date,
  notes
FROM stocks 
ORDER BY trade_date DESC, action DESC, created_at ASC;

-- Show the CORRECT summary statistics that should match your analytics
SELECT 
  COUNT(*) as total_trades,
  COUNT(DISTINCT symbol) as unique_stocks,
  SUM(CASE WHEN action = 'buy' THEN total_value ELSE 0 END) as total_buy_value,
  SUM(CASE WHEN action = 'sell' THEN total_value ELSE 0 END) as total_sell_value,
  SUM(CASE WHEN action = 'sell' THEN total_value ELSE -total_value END) as net_profit,
  ROUND(
    (SUM(CASE WHEN action = 'sell' THEN total_value ELSE -total_value END) / 
     SUM(CASE WHEN action = 'buy' THEN total_value ELSE 0 END)) * 100, 2
  ) as roi_percentage
FROM stocks;

-- Show individual trade profits to verify
SELECT 
  DATE(trade_date) as trade_date,
  symbol,
  SUM(CASE WHEN action = 'buy' THEN -total_value ELSE total_value END) as trade_profit
FROM stocks 
GROUP BY DATE(trade_date), symbol
ORDER BY trade_date DESC;
