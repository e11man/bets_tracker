import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Bet {
  id?: number
  team_or_player: string
  sportsbook: string
  result: 'pending' | 'won' | 'lost'
  stake: number
  odds: number
  bet_amount: string // This is your date field
  potential_payout: number
  created_at?: string
  updated_at?: string
}

export interface Stock {
  id?: number
  symbol: string
  company_name: string
  action: 'buy' | 'sell'
  quantity: number
  price: number
  total_value: number
  trade_date: string
  notes?: string
  created_at?: string
  updated_at?: string
}