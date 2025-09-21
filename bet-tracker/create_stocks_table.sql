-- Create stocks table for day trading tracker
CREATE TABLE stocks (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('buy', 'sell')),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,
  trade_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_stocks_symbol ON stocks(symbol);
CREATE INDEX idx_stocks_trade_date ON stocks(trade_date);
CREATE INDEX idx_stocks_action ON stocks(action);
CREATE INDEX idx_stocks_created_at ON stocks(created_at);

-- Add some common company names for reference
-- You can update these with actual company names as needed
