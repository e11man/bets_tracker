import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

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
  trade_type: 'day_trade' | 'buy_only' | 'sell_only'
  quantity: number
  buy_price?: number
  sell_price?: number
  buy_total?: number
  sell_total?: number
  profit_loss?: number
  profit_loss_percentage?: number
  trade_date: string
  buy_time?: string
  sell_time?: string
  notes?: string
  created_at?: string
  updated_at?: string
}