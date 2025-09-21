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
  // New fields for accurate bankroll tracking
  startingBankroll: number
  currentBankroll: number
  totalProfitLoss: number
  bankrollGrowthPercentage: number
  averageYearlyReturn: number
  timeInMarketDays: number
  winRate: number
  // Goal tracking fields
  goalAmount: number
  averageWager: number
  averageMultiplier: number
  estimatedBetsToGoal: number
  projectedDaysToGoal: number
  projectedFinalBankroll: number
}

export default function ROIAnalytics() {
  const [roiData, setRoiData] = useState<ROIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  useEffect(() => {
    fetchROIData()
  }, [fetchROIData])

  const calculateROI = (bets: BetData[]) => {
    const completedBets = bets.filter(bet => bet.result !== 'pending')
    const pendingBets = bets.filter(bet => bet.result === 'pending')

    const totalBets = bets.length
    const completedBetsCount = completedBets.length
    
    // Bankroll constants
    const STARTING_BANKROLL = 100.00
    
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

    // NEW BANKROLL-BASED CALCULATIONS
    const totalProfitLoss = totalWon - totalLost // Net profit/loss from completed bets
    const currentBankroll = STARTING_BANKROLL + totalProfitLoss
    const bankrollGrowthPercentage = (totalProfitLoss / STARTING_BANKROLL) * 100

    // Calculate time in market for annualized return
    let timeInMarketDays = 0
    let averageYearlyReturn = 0
    
    if (bets.length > 0) {
      const firstBetDate = new Date(bets[0].created_at)
      const today = new Date()
      timeInMarketDays = Math.max(1, Math.floor((today.getTime() - firstBetDate.getTime()) / (1000 * 60 * 60 * 24)))
      
      // Calculate annualized return - only if we have enough data (at least 7 days)
      const yearsInMarket = timeInMarketDays / 365.25
      if (timeInMarketDays >= 7 && yearsInMarket > 0 && currentBankroll > 0) {
        // Compound annual growth rate (CAGR) formula: (Ending Value / Beginning Value)^(1/years) - 1
        const cagr = (Math.pow(currentBankroll / STARTING_BANKROLL, 1 / yearsInMarket) - 1) * 100
        // Cap at reasonable limits (-99% to +10000%)
        averageYearlyReturn = Math.max(-99, Math.min(10000, cagr))
      } else {
        // For periods less than 7 days, don't calculate annualized return
        averageYearlyReturn = 0
      }
    }

    // Calculate win rate
    const wonBets = completedBets.filter(bet => bet.result === 'won').length
    const winRate = completedBetsCount > 0 ? (wonBets / completedBetsCount) * 100 : 0

    // GOAL TRACKING CALCULATIONS
    const GOAL_AMOUNT = 1000.00
    
    // Calculate average wager and multiplier from completed bets
    let averageWager = 0
    let averageMultiplier = 0
    let estimatedBetsToGoal = 0
    let projectedDaysToGoal = 0
    let projectedFinalBankroll = currentBankroll

    if (completedBetsCount > 0) {
      averageWager = totalStakedCompleted / completedBetsCount
      averageMultiplier = completedBets.reduce((sum, bet) => sum + bet.odds, 0) / completedBetsCount
      
      // Calculate expected value per bet
      const winProbability = winRate / 100
      const lossProbability = 1 - winProbability
      
      // Expected value = (win_prob * payout) - (loss_prob * stake)
      // For 5% bankroll strategy, wager = 0.05 * current_bankroll
      // Payout = wager * multiplier, Loss = wager
      const expectedValuePercentage = (winProbability * averageMultiplier) - lossProbability
      
      if (expectedValuePercentage > 0 && currentBankroll < GOAL_AMOUNT) {
        // Monte Carlo simulation for 5% bankroll strategy
        let simulatedBankroll = currentBankroll
        let betsSimulated = 0
        const maxBets = 1000 // Safety limit
        
        while (simulatedBankroll < GOAL_AMOUNT && betsSimulated < maxBets) {
          const wagerAmount = simulatedBankroll * 0.05
          
          // Simulate bet outcome based on win rate
          if (Math.random() < winProbability) {
            // Win: add profit (wager * (multiplier - 1))
            simulatedBankroll += wagerAmount * (averageMultiplier - 1)
          } else {
            // Loss: subtract wager
            simulatedBankroll -= wagerAmount
          }
          
          betsSimulated++
          
          // Safety check to prevent infinite loop
          if (simulatedBankroll <= 0) break
        }
        
        estimatedBetsToGoal = betsSimulated < maxBets ? betsSimulated : -1
        projectedFinalBankroll = simulatedBankroll
        
        // Estimate days based on current betting frequency
        if (timeInMarketDays > 0 && totalBets > 0) {
          const betsPerDay = totalBets / timeInMarketDays
          projectedDaysToGoal = betsPerDay > 0 ? Math.ceil(estimatedBetsToGoal / betsPerDay) : -1
        }
      }
    }

    // OLD ROI calculation for comparison (based on staked amount) - keeping for future reference
    // const traditionalROI = totalStakedCompleted > 0 ? (totalProfitLoss / totalStakedCompleted) * 100 : 0

    // Calculate cumulative bankroll growth over time - ONLY for completed bets in chronological order
    let cumulativeProfit = 0
    const cumulativeROI: number[] = []
    const targetGrowth: number[] = []

    // Process only completed bets in chronological order for the graph
    completedBets.forEach((bet) => {
      if (bet.result === 'won') {
        cumulativeProfit += bet.potential_payout - bet.stake // Net profit from this bet
      } else if (bet.result === 'lost') {
        cumulativeProfit -= bet.stake // Loss from this bet
      }
      
      // Calculate cumulative bankroll growth percentage up to this point
      const currentBankrollGrowth = (cumulativeProfit / STARTING_BANKROLL) * 100
      cumulativeROI.push(currentBankrollGrowth)
      
      // Target is always 5% growth from starting bankroll
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
      currentROI: bankrollGrowthPercentage, // NOW BASED ON BANKROLL GROWTH
      projectedROI: 5.0,
      cumulativeROI,
      targetGrowth,
      completedBetsCount,
      // New bankroll tracking fields
      startingBankroll: STARTING_BANKROLL,
      currentBankroll,
      totalProfitLoss,
      bankrollGrowthPercentage,
      averageYearlyReturn,
      timeInMarketDays,
      winRate,
      // Goal tracking fields
      goalAmount: GOAL_AMOUNT,
      averageWager,
      averageMultiplier,
      estimatedBetsToGoal,
      projectedDaysToGoal,
      projectedFinalBankroll
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

      {/* Bankroll Performance */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Bankroll Performance</h4>
        <div className={styles.metricGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Starting Bankroll</div>
            <div className={styles.metricValue}>${roiData.startingBankroll.toFixed(2)}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Current Bankroll</div>
            <div className={`${styles.metricValue} ${roiData.totalProfitLoss >= 0 ? styles.positive : styles.negative}`}>
              ${roiData.currentBankroll.toFixed(2)}
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total P&L</div>
            <div className={`${styles.metricValue} ${roiData.totalProfitLoss >= 0 ? styles.positive : styles.negative}`}>
              ${roiData.totalProfitLoss >= 0 ? '+' : ''}${roiData.totalProfitLoss.toFixed(2)}
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Bankroll Growth</div>
            <div className={`${styles.metricValue} ${roiData.bankrollGrowthPercentage >= 0 ? styles.positive : styles.negative}`}>
              {roiData.bankrollGrowthPercentage >= 0 ? '+' : ''}{roiData.bankrollGrowthPercentage.toFixed(2)}%
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Annualized Return</div>
            <div className={`${styles.metricValue} ${roiData.averageYearlyReturn >= 0 ? styles.positive : styles.negative}`}>
              {roiData.timeInMarketDays < 7 
                ? 'N/A (< 7 days)'
                : `${roiData.averageYearlyReturn >= 0 ? '+' : ''}${roiData.averageYearlyReturn.toFixed(2)}%`
              }
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Days Trading</div>
            <div className={styles.metricValue}>{roiData.timeInMarketDays}</div>
          </div>
        </div>
      </div>

      {/* Betting Statistics */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Betting Statistics</h4>
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
            <div className={styles.metricLabel}>Total Staked</div>
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
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Win Rate</div>
            <div className={styles.metricValue}>
              {roiData.completedBetsCount > 0 
                ? `${roiData.winRate.toFixed(1)}%`
                : 'N/A (No completed bets)'
              }
            </div>
          </div>
        </div>
      </div>

      {/* ROI Comparison */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Bankroll Growth Analysis</h4>
        <div className={styles.roiComparison}>
          <div className={styles.roiCard}>
            <div className={styles.roiLabel}>Total Bankroll Growth</div>
            <div className={`${styles.roiValue} ${roiData.currentROI >= 0 ? styles.positive : styles.negative}`}>
              {roiData.currentROI >= 0 ? '+' : ''}{roiData.currentROI.toFixed(2)}%
            </div>
            <div className={styles.roiSubtext}>
              From $100 to ${roiData.currentBankroll.toFixed(2)}
            </div>
          </div>
          <div className={styles.roiCard}>
            <div className={styles.roiLabel}>Annualized Return</div>
            <div className={`${styles.roiValue} ${roiData.averageYearlyReturn >= 0 ? styles.positive : styles.negative}`}>
              {roiData.timeInMarketDays < 7 
                ? 'N/A'
                : `${roiData.averageYearlyReturn >= 0 ? '+' : ''}${roiData.averageYearlyReturn.toFixed(2)}%`
              }
            </div>
            <div className={styles.roiSubtext}>
              {roiData.timeInMarketDays < 7 
                ? `Need 7+ days (currently ${roiData.timeInMarketDays})`
                : `Based on ${roiData.timeInMarketDays} days`
              }
            </div>
          </div>
          <div className={styles.roiCard}>
            <div className={styles.roiLabel}>5% Target Growth</div>
            <div className={styles.roiValue}>
              +{roiData.projectedROI.toFixed(2)}%
            </div>
            <div className={styles.roiSubtext}>
              Target: $105.00
            </div>
          </div>
        </div>
        <div className={styles.roiNote}>
          <p><strong>New Accurate Calculation:</strong> ROI now based on your $100 starting bankroll, not total staked amount</p>
          <p>This gives you the true percentage growth of your initial investment</p>
        </div>
      </div>

      {/* Goal Tracking */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>🎯 $1000 Goal Tracker</h4>
        {roiData.completedBetsCount > 0 ? (
          <>
            <div className={styles.goalProgress}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${Math.min((roiData.currentBankroll / roiData.goalAmount) * 100, 100)}%` }}
                ></div>
              </div>
              <div className={styles.progressText}>
                ${roiData.currentBankroll.toFixed(2)} / ${roiData.goalAmount.toFixed(2)} 
                ({((roiData.currentBankroll / roiData.goalAmount) * 100).toFixed(1)}%)
              </div>
            </div>

            <div className={styles.goalMetrics}>
              <div className={styles.goalCard}>
                <div className={styles.goalLabel}>Average Wager</div>
                <div className={styles.goalValue}>${roiData.averageWager.toFixed(2)}</div>
                <div className={styles.goalSubtext}>Historical average</div>
              </div>
              <div className={styles.goalCard}>
                <div className={styles.goalLabel}>Average Multiplier</div>
                <div className={styles.goalValue}>{roiData.averageMultiplier.toFixed(2)}x</div>
                <div className={styles.goalSubtext}>Odds average</div>
              </div>
              <div className={styles.goalCard}>
                <div className={styles.goalLabel}>Win Rate</div>
                <div className={styles.goalValue}>{roiData.winRate.toFixed(1)}%</div>
                <div className={styles.goalSubtext}>Success rate</div>
              </div>
            </div>

            <div className={styles.goalProjection}>
              {roiData.currentBankroll >= roiData.goalAmount ? (
                <div className={styles.goalAchieved}>
                  <div className={styles.goalAchievedIcon}>🎉</div>
                  <div className={styles.goalAchievedText}>
                    <h3>Goal Achieved!</h3>
                    <p>Congratulations! You&apos;ve reached your $1000 target!</p>
                  </div>
                </div>
              ) : roiData.estimatedBetsToGoal > 0 ? (
                <div className={styles.goalEstimate}>
                  <div className={styles.goalEstimateHeader}>
                    <h3>Projection (5% Bankroll Strategy)</h3>
                  </div>
                  <div className={styles.goalEstimateGrid}>
                    <div className={styles.goalEstimateItem}>
                      <div className={styles.goalEstimateLabel}>Estimated Bets Needed</div>
                      <div className={styles.goalEstimateValue}>{roiData.estimatedBetsToGoal} bets</div>
                    </div>
                    <div className={styles.goalEstimateItem}>
                      <div className={styles.goalEstimateLabel}>Projected Timeline</div>
                      <div className={styles.goalEstimateValue}>
                        {roiData.projectedDaysToGoal > 0 
                          ? `~${roiData.projectedDaysToGoal} days`
                          : 'Calculating...'
                        }
                      </div>
                    </div>
                    <div className={styles.goalEstimateItem}>
                      <div className={styles.goalEstimateLabel}>Next Bet Size (5%)</div>
                      <div className={styles.goalEstimateValue}>
                        ${(roiData.currentBankroll * 0.05).toFixed(2)}
                      </div>
                    </div>
                    <div className={styles.goalEstimateItem}>
                      <div className={styles.goalEstimateLabel}>Expected Final</div>
                      <div className={styles.goalEstimateValue}>
                        ${roiData.projectedFinalBankroll.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className={styles.goalNote}>
                    <p><strong>Note:</strong> Projections based on your historical win rate ({roiData.winRate.toFixed(1)}%) and average multiplier ({roiData.averageMultiplier.toFixed(2)}x)</p>
                    <p>Using 5% bankroll strategy - bet size increases as bankroll grows</p>
                  </div>
                </div>
              ) : (
                <div className={styles.goalWarning}>
                  <div className={styles.goalWarningIcon}>⚠️</div>
                  <div className={styles.goalWarningText}>
                    <h3>Goal May Not Be Achievable</h3>
                    <p>Based on current performance, the expected value is negative or insufficient.</p>
                    <p>Consider improving win rate or finding better odds to reach your goal.</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.goalNoData}>
            <p>Complete some bets to see goal projections</p>
          </div>
        )}
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