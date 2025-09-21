'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './ROIAnalytics.module.css'

interface BetData {
  id: number
  team_or_player: string
  sportsbook: string
  result: 'pending' | 'won' | 'lost'
  stake: number
  odds: number
  bet_amount: string
  potential_payout: number
  created_at: string
}

interface ROIData {
  totalBets: number
  totalStaked: number
  totalWon: number
  totalLost: number
  pendingBets: number
  pendingStake: number
  maxPendingPayout: number
  currentROI: number
  projectedROI: number
  cumulativeROI: number[]
  targetGrowth: number[]
  completedBetsCount: number
}

export default function ROIAnalytics() {
  const [roiData, setRoiData] = useState<ROIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchROIData()
  }, [fetchROIData])

  const fetchROIData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const { data: bets, error } = await supabase
        .from('bets')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      if (bets) {
        calculateROI(bets as BetData[])
      }
    } catch (err) {
      console.error('Error fetching bets:', err)
      setError('Failed to load bet data')
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateROI = (bets: BetData[]) => {
    const completedBets = bets.filter(bet => bet.result !== 'pending')
    const pendingBets = bets.filter(bet => bet.result === 'pending')

    const totalBets = bets.length
    const completedBetsCount = completedBets.length
    
    // Only calculate ROI based on completed bets
    const totalStakedCompleted = completedBets.reduce((sum, bet) => sum + bet.stake, 0)
    const totalWon = completedBets
      .filter(bet => bet.result === 'won')
      .reduce((sum, bet) => sum + bet.potential_payout, 0)
    const totalLost = completedBets
      .filter(bet => bet.result === 'lost')
      .reduce((sum, bet) => sum + bet.stake, 0)

    // Pending bets info (separate from ROI calculation)
    const pendingStake = pendingBets.reduce((sum, bet) => sum + bet.stake, 0)
    const maxPendingPayout = pendingBets.reduce((sum, bet) => sum + bet.potential_payout, 0)

    // Current ROI calculation - ONLY based on completed bets
    const netProfit = totalWon - totalLost
    const currentROI = totalStakedCompleted > 0 ? (netProfit / totalStakedCompleted) * 100 : 0

    // Calculate cumulative ROI over time - ONLY for completed bets in chronological order
    let cumulativeStaked = 0
    let cumulativeProfit = 0
    const cumulativeROI: number[] = []
    const targetGrowth: number[] = []

    // Process only completed bets in chronological order for the graph
    completedBets.forEach(bet => {
      cumulativeStaked += bet.stake
      
      if (bet.result === 'won') {
        cumulativeProfit += bet.potential_payout - bet.stake // Net profit from this bet
      } else if (bet.result === 'lost') {
        cumulativeProfit -= bet.stake // Loss from this bet
      }
      
      // Calculate cumulative ROI up to this point
      const currentCumulativeROI = cumulativeStaked > 0 ? (cumulativeProfit / cumulativeStaked) * 100 : 0
      cumulativeROI.push(currentCumulativeROI)
      
      // Target is always 5%
      targetGrowth.push(5.0)
    })

    setRoiData({
      totalBets,
      totalStaked: totalStakedCompleted, // Only completed bets stake
      totalWon,
      totalLost,
      pendingBets: pendingBets.length,
      pendingStake,
      maxPendingPayout,
      currentROI,
      projectedROI: 5.0,
      cumulativeROI,
      targetGrowth,
      completedBetsCount
    })
  }

  const renderROIGraph = () => {
    if (!roiData || roiData.cumulativeROI.length === 0) {
      return (
        <div className={styles.noDataGraph}>
          <p>No completed bet data to display</p>
          <p className={styles.noDataSubtext}>Complete some bets to see your ROI performance</p>
        </div>
      )
    }

    const allValues = [...roiData.cumulativeROI, ...roiData.targetGrowth]
    const maxROI = Math.max(...allValues, 10) // Minimum 10% to show scale
    const minROI = Math.min(...allValues, -10) // Minimum -10% to show scale
    const range = maxROI - minROI || 20 // Prevent division by zero
    const height = 200
    const width = 350

    // Handle single point case
    const dataLength = roiData.cumulativeROI.length
    
    // Create SVG path for actual ROI line
    let actualPath = ''
    if (dataLength === 1) {
      // Single point - draw a horizontal line
      const y = height - ((roiData.cumulativeROI[0] - minROI) / range) * height
      actualPath = `M 0,${y} L ${width},${y}`
    } else {
      // Multiple points - normal line
      const actualPoints = roiData.cumulativeROI.map((roi, index) => {
        const x = (index / (dataLength - 1)) * width
        const y = height - ((roi - minROI) / range) * height
        return `${x},${y}`
      }).join(' L')
      actualPath = `M ${actualPoints}`
    }

    // Create SVG path for 5% target line
    let targetPath = ''
    if (dataLength === 1) {
      // Single point - draw a horizontal line at 5%
      const y = height - ((5 - minROI) / range) * height
      targetPath = `M 0,${y} L ${width},${y}`
    } else {
      // Multiple points - normal line
      const targetPoints = roiData.targetGrowth.map((roi, index) => {
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
              <pattern id="grid" width="35" height="35" patternUnits="userSpaceOnUse">
                <path d="M 35 0 L 0 0 0 35" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
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
              stroke="#25304A"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points for actual ROI */}
            {roiData.cumulativeROI.map((roi, index) => {
              const x = dataLength === 1 ? width / 2 : (index / (dataLength - 1)) * width
              const y = height - ((roi - minROI) / range) * height
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#25304A"
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
            <span>5% Target Growth</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendLine} style={{ backgroundColor: '#25304A' }}></div>
            <span>Your Actual Growth</span>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={fetchROIData} className={styles.retryButton}>
          Retry
        </button>
      </div>
    )
  }

  if (!roiData) {
    return (
      <div className={styles.noDataContainer}>
        <p>No bet data available</p>
      </div>
    )
  }

  return (
    <div className={styles.analyticsContainer}>
      <h3 className={styles.analyticsTitle}>ROI Analytics</h3>
      
      {/* ROI Graph */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>ROI Performance Over Time</h4>
        {renderROIGraph()}
      </div>

      {/* Current Performance */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Current Performance</h4>
        <div className={styles.metricGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Bets</div>
            <div className={styles.metricValue}>{roiData.totalBets}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Completed Bets</div>
            <div className={styles.metricValue}>{roiData.completedBetsCount}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Staked (Completed)</div>
            <div className={styles.metricValue}>${roiData.totalStaked.toFixed(2)}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Won</div>
            <div className={styles.metricValue}>${roiData.totalWon.toFixed(2)}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Lost</div>
            <div className={styles.metricValue}>${roiData.totalLost.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* ROI Comparison */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>ROI Analysis</h4>
        <div className={styles.roiComparison}>
          <div className={styles.roiCard}>
            <div className={styles.roiLabel}>Your Current ROI</div>
            <div className={`${styles.roiValue} ${roiData.currentROI >= 0 ? styles.positive : styles.negative}`}>
              {roiData.currentROI.toFixed(2)}%
            </div>
          </div>
          <div className={styles.roiCard}>
            <div className={styles.roiLabel}>5% Target Growth</div>
            <div className={styles.roiValue}>
              {roiData.projectedROI.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className={styles.roiNote}>
          <p>ROI calculated only from completed bets (won/lost), excluding pending bets</p>
        </div>
      </div>

      {/* Pending Bets */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Pending Bets</h4>
        <div className={styles.pendingInfo}>
          <div className={styles.pendingItem}>
            <span className={styles.pendingLabel}>Pending Bets:</span>
            <span className={styles.pendingValue}>{roiData.pendingBets}</span>
          </div>
          <div className={styles.pendingItem}>
            <span className={styles.pendingLabel}>Pending Stake:</span>
            <span className={styles.pendingValue}>${roiData.pendingStake.toFixed(2)}</span>
          </div>
          <div className={styles.pendingItem}>
            <span className={styles.pendingLabel}>Max Potential Payout:</span>
            <span className={styles.pendingValue}>${roiData.maxPendingPayout.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
