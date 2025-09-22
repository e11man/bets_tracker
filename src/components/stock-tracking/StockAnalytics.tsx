'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './StockAnalytics.module.css'

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

interface TradeProfit {
  symbol: string
  trade_date: string
  profit: number
  percentage: number
  buyValue: number
  sellValue: number
}

interface PerformanceData {
  totalTrades: number
  totalBuyValue: number
  totalSellValue: number
  netProfit: number
  winRate: number
  averageProfit: number
  bestTrade: number
  worstTrade: number
  tradeProfits: TradeProfit[]
  cumulativeROI: number[]
  targetROI: number[]
  tradeDates: string[]
  averageTradePercentage?: number
}

export default function StockAnalytics() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: trades, error } = await supabase
        .from('stocks')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      if (trades) {
        calculatePerformance(trades as StockData[])
      }
    } catch (err) {
      console.error('Error fetching trades:', err)
      setError('Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }

  const calculatePerformance = (trades: StockData[]) => {
    // Filter to only day trades for now (we can expand this later)
    const dayTrades = trades.filter(trade => trade.trade_type === 'day_trade')
    
    // Calculate individual trade profits
    const tradeProfits: TradeProfit[] = []
    let totalBuyValue = 0
    let totalSellValue = 0
    let cumulativeCapital = 0
    let cumulativeProfit = 0
    const cumulativeROI: number[] = []
    const targetROI: number[] = []
    const tradeDates: string[] = []
    const tradePercentages: number[] = []

    dayTrades.forEach(trade => {
      if (trade.buy_total && trade.sell_total && trade.profit_loss !== undefined) {
        const profit = trade.profit_loss
        const percentage = trade.profit_loss_percentage || 0
        
        tradeProfits.push({
          symbol: trade.symbol,
          trade_date: trade.trade_date,
          profit,
          percentage,
          buyValue: trade.buy_total,
          sellValue: trade.sell_total
        })

        // Store individual trade percentages for averaging
        tradePercentages.push(percentage)

        totalBuyValue += trade.buy_total
        totalSellValue += trade.sell_total
        
        // Calculate cumulative ROI
        cumulativeCapital += trade.buy_total
        cumulativeProfit += profit
        cumulativeROI.push(cumulativeCapital > 0 ? (cumulativeProfit / cumulativeCapital) * 100 : 0)
        
        // Calculate 5% annual target (assuming ~250 trading days per year)
        const daysSinceStart = Math.max(1, Math.floor((new Date(trade.trade_date).getTime() - new Date('2025-09-04').getTime()) / (1000 * 60 * 60 * 24)))
        const annualTarget = 5.0
        const dailyTarget = annualTarget / 250
        const targetGrowth = dailyTarget * daysSinceStart
        targetROI.push(Math.min(targetGrowth, annualTarget))
        
        tradeDates.push(trade.trade_date)
      }
    })

    const netProfit = totalSellValue - totalBuyValue
    const profitableTrades = tradeProfits.filter(trade => trade.profit > 0).length
    const winRate = tradeProfits.length > 0 ? (profitableTrades / tradeProfits.length) * 100 : 0
    
    // Calculate average percentage per trade (arithmetic mean of all trade percentages)
    const averageTradePercentage = tradePercentages.length > 0 ? 
      tradePercentages.reduce((sum, pct) => sum + pct, 0) / tradePercentages.length : 0

    setPerformanceData({
      totalTrades: tradeProfits.length,
      totalBuyValue,
      totalSellValue,
      netProfit,
      winRate,
      averageProfit: tradeProfits.length > 0 ? netProfit / tradeProfits.length : 0,
      bestTrade: tradeProfits.length > 0 ? Math.max(...tradeProfits.map(t => t.profit)) : 0,
      worstTrade: tradeProfits.length > 0 ? Math.min(...tradeProfits.map(t => t.profit)) : 0,
      tradeProfits,
      cumulativeROI,
      targetROI,
      tradeDates,
      averageTradePercentage // Add this new field
    })
  }

  const renderROIGraph = () => {
    if (!performanceData || performanceData.cumulativeROI.length === 0) {
      return (
        <div className={styles.noDataGraph}>
          <p>No trade data to display</p>
        </div>
      )
    }

    const allValues = [...performanceData.cumulativeROI, ...performanceData.targetROI]
    const maxROI = Math.max(...allValues, 10)
    const minROI = Math.min(...allValues, -5)
    const range = maxROI - minROI || 15
    const height = 200
    const width = 400

    const dataLength = performanceData.cumulativeROI.length
    
    // Create SVG path for actual ROI line
    let actualPath = ''
    if (dataLength === 1) {
      const y = height - ((performanceData.cumulativeROI[0] - minROI) / range) * height
      actualPath = `M 0,${y} L ${width},${y}`
    } else {
      const actualPoints = performanceData.cumulativeROI.map((roi, index) => {
        const x = (index / (dataLength - 1)) * width
        const y = height - ((roi - minROI) / range) * height
        return `${x},${y}`
      }).join(' L')
      actualPath = `M ${actualPoints}`
    }

    // Create SVG path for 5% target line
    let targetPath = ''
    if (dataLength === 1) {
      const y = height - ((performanceData.targetROI[0] - minROI) / range) * height
      targetPath = `M 0,${y} L ${width},${y}`
    } else {
      const targetPoints = performanceData.targetROI.map((roi, index) => {
        const x = (index / (dataLength - 1)) * width
        const y = height - ((roi - minROI) / range) * height
        return `${x},${y}`
      }).join(' L')
      targetPath = `M ${targetPoints}`
    }

    return (
      <div className={styles.graphContainer}>
        <div className={styles.graphWrapper}>
          <svg width={width} height={height} className={styles.roiGraph} viewBox={`0 0 ${width} ${height}`}>
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Zero line */}
            <line
              x1="0"
              y1={height - ((0 - minROI) / range) * height}
              x2={width}
              y2={height - ((0 - minROI) / range) * height}
              stroke="#D1D5DB"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            
            {/* 5% Target line */}
            <path
              d={targetPath}
              fill="none"
              stroke="#F5AF53"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Actual ROI line */}
            <path
              d={actualPath}
              fill="none"
              stroke="#059669"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points for actual ROI */}
            {performanceData.cumulativeROI.map((roi, index) => {
              const x = dataLength === 1 ? width / 2 : (index / (dataLength - 1)) * width
              const y = height - ((roi - minROI) / range) * height
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#059669"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )
            })}
          </svg>
          
          {/* Y-axis labels */}
          <div className={styles.yAxisLabels}>
            <span>{maxROI.toFixed(1)}%</span>
            <span>5%</span>
            <span>0%</span>
            <span>{minROI.toFixed(1)}%</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: '#F5AF53' }}></div>
            <span>5% Annual Target</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: '#059669' }}></div>
            <span>Your Actual ROI</span>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading performance data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={fetchPerformanceData} className={styles.retryButton}>
          Retry
        </button>
      </div>
    )
  }

  if (!performanceData) {
    return (
      <div className={styles.noDataContainer}>
        <p>No trade data available</p>
      </div>
    )
  }

  return (
    <div className={styles.analyticsContainer}>
      <h3 className={styles.analyticsTitle}>Trading Performance Analytics</h3>
      
      {/* ROI Performance Graph */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>ROI Performance vs 5% Annual Target</h4>
        {renderROIGraph()}
      </div>

      {/* Performance Overview */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Performance Overview</h4>
        <div className={styles.metricGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Trades</div>
            <div className={styles.metricValue}>{performanceData.totalTrades}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Capital Deployed</div>
            <div className={styles.metricValue}>${performanceData.totalBuyValue.toFixed(2)}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Returns</div>
            <div className={styles.metricValue}>${performanceData.totalSellValue.toFixed(2)}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Net Profit/Loss</div>
            <div className={`${styles.metricValue} ${performanceData.netProfit >= 0 ? styles.positive : styles.negative}`}>
              ${performanceData.netProfit.toFixed(2)}
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Average Win %</div>
            <div className={`${styles.metricValue} ${performanceData.netProfit >= 0 ? styles.positive : styles.negative}`}>
              {performanceData.averageTradePercentage?.toFixed(2) || '0.00'}%
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>$1500 Daily for Year</div>
            <div className={`${styles.metricValue} ${performanceData.netProfit >= 0 ? styles.positive : styles.negative}`}>
              {(() => {
                if (!performanceData.averageTradePercentage) return '$0.00'
                // Use actual average trade percentage
                const dailyRate = performanceData.averageTradePercentage / 100
                // Calculate what $1500 would grow to after 252 trading days
                const finalAmount = 1500 * Math.pow(1 + dailyRate, 252)
                const totalProfit = finalAmount - 1500
                return `$${totalProfit.toFixed(2)}`
              })()}
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Yearly % Return</div>
            <div className={`${styles.metricValue} ${performanceData.netProfit >= 0 ? styles.positive : styles.negative}`}>
              {(() => {
                if (!performanceData.averageTradePercentage) return '0%'
                // Use actual average trade percentage
                const dailyRate = performanceData.averageTradePercentage / 100
                // Calculate total percentage return for the year
                const yearlyReturnPercent = (Math.pow(1 + dailyRate, 252) - 1) * 100
                return yearlyReturnPercent.toFixed(1) + '%'
              })()}
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Annualized ROI</div>
            <div className={`${styles.metricValue} ${performanceData.netProfit >= 0 ? styles.positive : styles.negative}`}>
              {(() => {
                if (!performanceData.averageTradePercentage) return '0%'
                // Use actual average trade percentage
                const dailyRate = performanceData.averageTradePercentage / 100
                // Apply compounding formula: [(1 + daily rate)^252 - 1] * 100
                const annualizedROI = (Math.pow(1 + dailyRate, 252) - 1) * 100
                return annualizedROI.toFixed(2) + '%'
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Trading Statistics */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Trading Statistics</h4>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Win Rate</div>
            <div className={styles.statValue}>{performanceData.winRate.toFixed(1)}%</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Average Profit per Trade</div>
            <div className={`${styles.statValue} ${performanceData.averageProfit >= 0 ? styles.positive : styles.negative}`}>
              ${performanceData.averageProfit.toFixed(2)}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Best Trade</div>
            <div className={styles.statValue}>${performanceData.bestTrade.toFixed(2)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Worst Trade</div>
            <div className={styles.statValue}>${performanceData.worstTrade.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Individual Trade Breakdown */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Individual Trade Breakdown</h4>
        <div className={styles.tradesList}>
          {performanceData.tradeProfits.map((trade, index) => (
            <div key={index} className={styles.tradeItem}>
              <div className={styles.tradeHeader}>
                <span className={styles.tradeSymbol}>{trade.symbol}</span>
                <span className={styles.tradeDate}>{new Date(trade.trade_date).toLocaleDateString()}</span>
                <span className={`${styles.tradeProfit} ${trade.profit >= 0 ? styles.positive : styles.negative}`}>
                  ${trade.profit.toFixed(2)} ({trade.percentage.toFixed(2)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Note */}
      <div className={styles.note}>
        <p>✅ Performance calculations now properly track individual trade profits instead of double-counting transactions.</p>
      </div>
    </div>
  )
}
