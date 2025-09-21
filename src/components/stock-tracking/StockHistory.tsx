'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './StockHistory.module.css'

interface StockData {
  id: number
  symbol: string
  company_name: string
  action: 'buy' | 'sell'
  quantity: number
  price: number
  total_value: number
  trade_date: string
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
                  <div className={`${styles.tradeAction} ${trade.action === 'buy' ? styles.buyAction : styles.sellAction}`}>
                    {trade.action.toUpperCase()}
                  </div>
                </div>

                <div className={styles.tradeCardContent}>
                  <div className={styles.tradeInfoGrid}>
                    <div className={styles.tradeInfoItem}>
                      <span className={styles.tradeInfoLabel}>Quantity</span>
                      <span className={styles.tradeInfoValue}>{trade.quantity}</span>
                    </div>
                    
                    <div className={styles.tradeInfoItem}>
                      <span className={styles.tradeInfoLabel}>Price</span>
                      <span className={styles.tradeInfoValue}>${trade.price.toFixed(2)}</span>
                    </div>
                    
                    <div className={styles.tradeInfoItem}>
                      <span className={styles.tradeInfoLabel}>Total Value</span>
                      <span className={styles.tradeInfoValue}>${trade.total_value.toFixed(2)}</span>
                    </div>
                    
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
          <span>Buy Orders: {trades.filter(t => t.action === 'buy').length}</span>
          <span>Sell Orders: {trades.filter(t => t.action === 'sell').length}</span>
        </div>
      </div>
    </div>
  )
}
