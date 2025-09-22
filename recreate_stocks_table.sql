-- Complete migration script to recreate stocks table with day trade structure
-- This will drop the old table, create the new one, and migrate all existing data

-- Step 1: Drop the existing stocks table
DROP TABLE IF EXISTS stocks CASCADE;

-- Step 2: Create the new stocks table with day trade structure
CREATE TABLE stocks (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  trade_type VARCHAR(20) NOT NULL DEFAULT 'day_trade' CHECK (trade_type IN ('day_trade', 'buy_only', 'sell_only')),
  quantity INTEGER NOT NULL,
  buy_price DECIMAL(10,2),
  sell_price DECIMAL(10,2),
  buy_total DECIMAL(10,2),
  sell_total DECIMAL(10,2),
  profit_loss DECIMAL(10,2),
  profit_loss_percentage DECIMAL(5,2),
  trade_date DATE NOT NULL,
  buy_time TIME,
  sell_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX idx_stocks_symbol ON stocks(symbol);
CREATE INDEX idx_stocks_trade_date ON stocks(trade_date);
CREATE INDEX idx_stocks_trade_type ON stocks(trade_type);
CREATE INDEX idx_stocks_created_at ON stocks(created_at);

-- Step 4: Add constraints to ensure data integrity
ALTER TABLE stocks ADD CONSTRAINT check_day_trade_prices 
  CHECK (
    (trade_type = 'day_trade' AND buy_price IS NOT NULL AND sell_price IS NOT NULL) OR
    (trade_type = 'buy_only' AND buy_price IS NOT NULL AND sell_price IS NULL) OR
    (trade_type = 'sell_only' AND buy_price IS NULL AND sell_price IS NOT NULL)
  );

ALTER TABLE stocks ADD CONSTRAINT check_profit_loss_calculation
  CHECK (
    (trade_type = 'day_trade' AND profit_loss = (sell_total - buy_total)) OR
    (trade_type IN ('buy_only', 'sell_only') AND profit_loss IS NULL)
  );

-- Step 5: Insert all existing trades as day trades
-- First, let's recreate the original data structure temporarily to migrate from
-- We'll insert the trades that were in your insert_trading_data.sql file

INSERT INTO stocks (
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
  notes,
  created_at,
  updated_at
) VALUES
-- SPRC day trade (3 shares bought at $4.14, sold at $4.22)
('SPRC', 'Spruce Power Holding Corp', 'day_trade', 3, 4.14, 4.22, 12.42, 12.66, 0.24, 1.93, '2025-09-17', '09:30:00', '15:45:00', 'Day trade - 1.93% profit', '2025-09-17T09:30:00Z', NOW()),

-- ORCL day trade (1 share bought at $333, sold at $335)
('ORCL', 'Oracle Corporation', 'day_trade', 1, 333.00, 335.00, 333.00, 335.00, 2.00, 0.60, '2025-09-10', '10:15:00', '14:30:00', 'Day trade - 0.6% profit', '2025-09-10T10:15:00Z', NOW()),

-- TSLA day trade (2 shares bought at $349.62, sold at $350.39)
('TSLA', 'Tesla Inc', 'day_trade', 2, 349.62, 350.39, 699.24, 700.78, 1.54, 0.22, '2025-09-09', '09:45:00', '11:20:00', 'Day trade - 0.22% profit', '2025-09-09T09:45:00Z', NOW()),

-- ORCL day trade #2 (2 shares bought at $324.86, sold at $326.56)
('ORCL', 'Oracle Corporation', 'day_trade', 2, 324.86, 326.56, 649.72, 653.12, 3.40, 0.52, '2025-09-09', '13:00:00', '16:00:00', 'Day trade - 0.52% profit', '2025-09-09T13:00:00Z', NOW()),

-- AVGO day trade (1 share bought at $346.89, sold at $349.4)
('AVGO', 'Broadcom Inc', 'day_trade', 1, 346.89, 349.40, 346.89, 349.40, 2.51, 0.72, '2025-09-07', '10:00:00', '15:30:00', 'Day trade - 0.72% profit', '2025-09-07T10:00:00Z', NOW()),

-- AMD day trade (1 share bought at $154.03, sold at $154.57)
('AMD', 'Advanced Micro Devices Inc', 'day_trade', 1, 154.03, 154.57, 154.03, 154.57, 0.54, 0.35, '2025-09-05', '09:30:00', '12:45:00', 'Day trade - 0.35% profit', '2025-09-05T09:30:00Z', NOW()),

-- AEO day trade (4 shares bought at $17.49, sold at $17.81)
('AEO', 'American Eagle Outfitters Inc', 'day_trade', 4, 17.49, 17.81, 69.96, 71.24, 1.28, 1.83, '2025-09-04', '09:30:00', '14:15:00', 'Day trade - 1.83% profit', '2025-09-04T09:30:00Z', NOW());

-- Step 6: Verify the migration
SELECT 
  'Migration Summary' as summary,
  COUNT(*) as total_trades,
  SUM(profit_loss) as total_profit,
  AVG(profit_loss_percentage) as avg_profit_percentage
FROM stocks;

-- Step 7: Show all migrated trades
SELECT 
  symbol,
  company_name,
  quantity,
  buy_price,
  sell_price,
  profit_loss,
  profit_loss_percentage,
  trade_date,
  buy_time,
  sell_time
FROM stocks 
ORDER BY trade_date DESC, created_at ASC;

-- Step 8: Show summary by symbol
SELECT 
  symbol,
  COUNT(*) as trade_count,
  SUM(profit_loss) as total_profit,
  AVG(profit_loss_percentage) as avg_profit_percentage
FROM stocks 
GROUP BY symbol
ORDER BY total_profit DESC;
