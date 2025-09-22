-- Migration script to convert existing stocks table to new day trade format
-- This script will:
-- 1. Create the new table structure
-- 2. Migrate existing data from separate buy/sell entries to combined day trades
-- 3. Drop the old table and rename the new one

-- Step 1: Create the new table structure
CREATE TABLE stocks_new (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  trade_type VARCHAR(20) NOT NULL CHECK (trade_type IN ('day_trade', 'buy_only', 'sell_only')),
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

-- Step 2: Create indexes
CREATE INDEX idx_stocks_new_symbol ON stocks_new(symbol);
CREATE INDEX idx_stocks_new_trade_date ON stocks_new(trade_date);
CREATE INDEX idx_stocks_new_trade_type ON stocks_new(trade_type);
CREATE INDEX idx_stocks_new_created_at ON stocks_new(created_at);

-- Step 3: Migrate existing data by combining buy/sell pairs into day trades
-- This query groups buy and sell transactions by symbol and trade_date
-- and creates single day trade entries
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
  notes, 
  created_at, 
  updated_at
)
SELECT 
  b.symbol,
  b.company_name,
  'day_trade' as trade_type,
  b.quantity,
  b.price as buy_price,
  s.price as sell_price,
  b.total_value as buy_total,
  s.total_value as sell_total,
  (s.total_value - b.total_value) as profit_loss,
  ROUND(((s.total_value - b.total_value) / b.total_value) * 100, 2) as profit_loss_percentage,
  b.trade_date,
  EXTRACT(TIME FROM b.created_at) as buy_time,
  EXTRACT(TIME FROM s.created_at) as sell_time,
  b.notes,
  b.created_at,
  NOW() as updated_at
FROM stocks b
JOIN stocks s ON (
  b.symbol = s.symbol AND 
  b.trade_date = s.trade_date AND 
  b.action = 'buy' AND 
  s.action = 'sell' AND
  b.quantity = s.quantity
)
WHERE b.action = 'buy' AND s.action = 'sell';

-- Step 4: Handle any remaining buy-only or sell-only transactions
-- (In case there are unmatched transactions)
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
  notes, 
  created_at, 
  updated_at
)
SELECT 
  symbol,
  company_name,
  CASE 
    WHEN action = 'buy' THEN 'buy_only'
    WHEN action = 'sell' THEN 'sell_only'
  END as trade_type,
  quantity,
  CASE WHEN action = 'buy' THEN price ELSE NULL END as buy_price,
  CASE WHEN action = 'sell' THEN price ELSE NULL END as sell_price,
  CASE WHEN action = 'buy' THEN total_value ELSE NULL END as buy_total,
  CASE WHEN action = 'sell' THEN total_value ELSE NULL END as sell_total,
  NULL as profit_loss,
  NULL as profit_loss_percentage,
  trade_date,
  EXTRACT(TIME FROM created_at) as buy_time,
  EXTRACT(TIME FROM created_at) as sell_time,
  notes,
  created_at,
  NOW() as updated_at
FROM stocks
WHERE id NOT IN (
  -- Exclude transactions that were already migrated as day trades
  SELECT b.id FROM stocks b
  JOIN stocks s ON (
    b.symbol = s.symbol AND 
    b.trade_date = s.trade_date AND 
    b.action = 'buy' AND 
    s.action = 'sell' AND
    b.quantity = s.quantity
  )
  WHERE b.action = 'buy'
  UNION
  SELECT s.id FROM stocks b
  JOIN stocks s ON (
    b.symbol = s.symbol AND 
    b.trade_date = s.trade_date AND 
    b.action = 'buy' AND 
    s.action = 'sell' AND
    b.quantity = s.quantity
  )
  WHERE s.action = 'sell'
);

-- Step 5: Add constraints after data migration
ALTER TABLE stocks_new ADD CONSTRAINT check_day_trade_prices 
  CHECK (
    (trade_type = 'day_trade' AND buy_price IS NOT NULL AND sell_price IS NOT NULL) OR
    (trade_type = 'buy_only' AND buy_price IS NOT NULL AND sell_price IS NULL) OR
    (trade_type = 'sell_only' AND buy_price IS NULL AND sell_price IS NOT NULL)
  );

ALTER TABLE stocks_new ADD CONSTRAINT check_profit_loss_calculation
  CHECK (
    (trade_type = 'day_trade' AND profit_loss = (sell_total - buy_total)) OR
    (trade_type IN ('buy_only', 'sell_only') AND profit_loss IS NULL)
  );

-- Step 6: Verify the migration
SELECT 
  trade_type,
  COUNT(*) as count,
  SUM(profit_loss) as total_profit_loss
FROM stocks_new 
GROUP BY trade_type;

-- Step 7: Show sample of migrated data
SELECT 
  symbol,
  company_name,
  trade_type,
  quantity,
  buy_price,
  sell_price,
  profit_loss,
  profit_loss_percentage,
  trade_date
FROM stocks_new 
ORDER BY trade_date DESC, created_at ASC
LIMIT 10;

-- Step 8: Backup and replace the old table
-- (Uncomment these lines when you're ready to complete the migration)
-- ALTER TABLE stocks RENAME TO stocks_backup;
-- ALTER TABLE stocks_new RENAME TO stocks;
-- DROP TABLE stocks_backup;
