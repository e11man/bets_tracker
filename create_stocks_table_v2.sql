-- Create stocks table for day trading tracker (Version 2)
-- This version stores day trades as single entries with both buy and sell information
CREATE TABLE stocks_v2 (
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

-- Create indexes for better performance
CREATE INDEX idx_stocks_v2_symbol ON stocks_v2(symbol);
CREATE INDEX idx_stocks_v2_trade_date ON stocks_v2(trade_date);
CREATE INDEX idx_stocks_v2_trade_type ON stocks_v2(trade_type);
CREATE INDEX idx_stocks_v2_created_at ON stocks_v2(created_at);

-- Add constraints to ensure data integrity
ALTER TABLE stocks_v2 ADD CONSTRAINT check_day_trade_prices 
  CHECK (
    (trade_type = 'day_trade' AND buy_price IS NOT NULL AND sell_price IS NOT NULL) OR
    (trade_type = 'buy_only' AND buy_price IS NOT NULL AND sell_price IS NULL) OR
    (trade_type = 'sell_only' AND buy_price IS NULL AND sell_price IS NOT NULL)
  );

-- Add constraint to ensure profit/loss calculation is consistent
ALTER TABLE stocks_v2 ADD CONSTRAINT check_profit_loss_calculation
  CHECK (
    (trade_type = 'day_trade' AND profit_loss = (sell_total - buy_total)) OR
    (trade_type IN ('buy_only', 'sell_only') AND profit_loss IS NULL)
  );
