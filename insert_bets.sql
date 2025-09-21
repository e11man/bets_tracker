-- SQL script to insert PrizePicks bets from JSON file into the bets table
-- Run this in your Supabase SQL editor

INSERT INTO bets (
  team_or_player,
  sportsbook,
  result,
  stake,
  odds,
  bet_amount,
  potential_payout,
  created_at,
  updated_at
) VALUES 
-- Bet 1
('Texans ML', 'Fliff', 'pending', 4.00, 1.95, '2025-09-20', 7.80, '2025-09-20T16:19:54.000Z', NOW()),

-- Bet 2
('USC 1H, Oklahoma ML', 'Fliff', 'pending', 7.00, 1.56, '2025-09-20', 10.92, '2025-09-20T16:19:20.901Z', NOW()),

-- Bet 3
('Oklahoma -8.5', 'Fliff', 'pending', 1.00, 2.15, '2025-09-20', 2.15, '2025-09-20T16:18:36.540Z', NOW()),

-- Bet 4
('Christian McCaffery ANY TD', 'Fliff', 'pending', 1.75, 1.50, '2025-09-20', 2.63, '2025-09-20T15:52:12.944Z', NOW()),

-- Bet 5
('Arsenal ML, Barcelona ML', 'Fliff', 'pending', 1.00, 2.12, '2025-09-20', 2.12, '2025-09-20T15:51:10.294Z', NOW()),

-- Bet 6
('Jonathan Taylor > 84.5 rush + rec yards, Bijan Robinson 82.5 > rushing yards, Sam Darnold > 189.5 pass yards', 'UnderDog', 'pending', 5.00, 4.32, '2025-09-20', 21.60, '2025-09-20T15:49:08.442Z', NOW()),

-- Bet 7
('Bijan Robinson anytime touchdown', 'PrizePicks', 'pending', 5.00, 2.25, '2025-09-20', 11.25, '2025-09-20T15:23:48.356Z', NOW()),

-- Bet 8
('Aaron Rodgers > 1.5 TD', 'PrizePicks', 'pending', 1.00, 3.50, '2025-09-20', 3.50, '2025-09-20T15:23:12.621Z', NOW()),

-- Bet 9
('Sam Donald > 179.5 passing yards', 'PrizePicks', 'pending', 1.00, 2.25, '2025-09-20', 2.25, '2025-09-20T15:22:45.005Z', NOW()),

-- Bet 10
('Jonathan Taylor > 74.5 rushing yards', 'PrizePicks', 'pending', 1.00, 2.24, '2025-09-20', 2.24, '2025-09-20T15:22:17.321Z', NOW()),

-- Bet 11
('Mahomes > .5 yards and Rome Odunze > 4.5 receptions', 'PrizePicks', 'pending', 1.00, 2.20, '2025-09-20', 2.20, '2025-09-20T15:21:53.487Z', NOW()),

-- Bet 12
('Mahomes > 0.5 yards and D andres Swift > 1.5 receptions', 'PrizePicks', 'pending', 1.00, 2.25, '2025-09-20', 2.25, '2025-09-20T15:19:05.618Z', NOW());

-- Verify the insert
SELECT COUNT(*) as total_bets FROM bets;

-- Show all inserted bets
SELECT 
  id,
  team_or_player,
  sportsbook,
  result,
  stake,
  odds,
  potential_payout,
  bet_amount as date,
  created_at
FROM bets 
ORDER BY created_at DESC;
