'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './StockHistory.module.css'

interface StockData {
  id: number
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
  created_at: string
}

export default function StockHistory() {
  const [trades, setTrades] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTrades()
  }, [])

  const fetchTrades = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setTrades(data || [])
    } catch (err) {
      console.error('Error fetching trades:', err)
      setError('Failed to load trade data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading trade history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={fetchTrades} className={styles.retryButton}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={styles.historyContainer}>
      <h3 className={styles.historyTitle}>Trade History</h3>

      {/* Trade List */}
      <div className={styles.tradeList}>
        {trades.length === 0 ? (
          <div className={styles.noTrades}>
            <p>No trades found. Start by placing your first trade!</p>
          </div>
        ) : (
          <>
            {trades.map((trade) => (
              <div key={trade.id} className={styles.tradeCard}>
                <div className={styles.tradeCardHeader}>
                  <div className={styles.tradeCardTitle}>
                    <span className={styles.tradeSymbol}>{trade.symbol}</span>
                    <span className={styles.tradeCompany}>{trade.company_name}</span>
                  </div>
                  <div className={`${styles.tradeAction} ${
                    trade.trade_type === 'day_trade' ? styles.dayTradeAction : 
                    trade.trade_type === 'buy_only' ? styles.buyAction : styles.sellAction
                  }`}>
                    {trade.trade_type.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                <div className={styles.tradeCardContent}>
                  <div className={styles.tradeInfoGrid}>
                    <div className={styles.tradeInfoItem}>
                      <span className={styles.tradeInfoLabel}>Quantity</span>
                      <span className={styles.tradeInfoValue}>{trade.quantity}</span>
                    </div>
                    
                    {trade.trade_type === 'day_trade' && (
                      <>
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Buy Price</span>
                          <span className={styles.tradeInfoValue}>${trade.buy_price?.toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Sell Price</span>
                          <span className={styles.tradeInfoValue}>${trade.sell_price?.toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Buy Total</span>
                          <span className={styles.tradeInfoValue}>${trade.buy_total?.toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Sell Total</span>
                          <span className={styles.tradeInfoValue}>${trade.sell_total?.toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Profit/Loss</span>
                          <span className={`${styles.tradeInfoValue} ${
                            trade.profit_loss && trade.profit_loss >= 0 ? styles.profitValue : styles.lossValue
                          }`}>
                            ${trade.profit_loss?.toFixed(2)} ({trade.profit_loss_percentage?.toFixed(2)}%)
                          </span>
                        </div>
                        
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Buy Time</span>
                          <span className={styles.tradeInfoValue}>{trade.buy_time}</span>
                        </div>
                        
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Sell Time</span>
                          <span className={styles.tradeInfoValue}>{trade.sell_time}</span>
                        </div>
                      </>
                    )}
                    
                    {trade.trade_type === 'buy_only' && (
                      <>
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Buy Price</span>
                          <span className={styles.tradeInfoValue}>${trade.buy_price?.toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Buy Total</span>
                          <span className={styles.tradeInfoValue}>${trade.buy_total?.toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Buy Time</span>
                          <span className={styles.tradeInfoValue}>{trade.buy_time}</span>
                        </div>
                      </>
                    )}
                    
                    {trade.trade_type === 'sell_only' && (
                      <>
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Sell Price</span>
                          <span className={styles.tradeInfoValue}>${trade.sell_price?.toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Sell Total</span>
                          <span className={styles.tradeInfoValue}>${trade.sell_total?.toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.tradeInfoItem}>
                          <span className={styles.tradeInfoLabel}>Sell Time</span>
                          <span className={styles.tradeInfoValue}>{trade.sell_time}</span>
                        </div>
                      </>
                    )}
                    
                    <div className={styles.tradeInfoItem}>
                      <span className={styles.tradeInfoLabel}>Date</span>
                      <span className={styles.tradeInfoValue}>{formatDate(trade.trade_date)}</span>
                    </div>
                  </div>
                  
                  {trade.notes && (
                    <div className={styles.tradeNotes}>
                      <span className={styles.notesLabel}>Notes:</span>
                      <span className={styles.notesValue}>{trade.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Summary */}
      <div className={styles.summarySection}>
        <div className={styles.summaryStats}>
          <span>Total Trades: {trades.length}</span>
          <span>Day Trades: {trades.filter(t => t.trade_type === 'day_trade').length}</span>
          <span>Buy Only: {trades.filter(t => t.trade_type === 'buy_only').length}</span>
          <span>Sell Only: {trades.filter(t => t.trade_type === 'sell_only').length}</span>
        </div>
      </div>
    </div>
  )
}
