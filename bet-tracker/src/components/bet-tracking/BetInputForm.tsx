'use client'

import { useState, useEffect } from 'react'
import { supabase, Bet } from '@/lib/supabase'
import styles from './BetInputForm.module.css'

export default function BetInputForm() {
  // Get today's date in YYYY-MM-DD format for the date input
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState<Omit<Bet, 'id' | 'createdAt'>>({
    sportsbook: '',
    team_or_player: '',
    bet_amount: getTodayDate(), // Auto-set to today's date
    odds: 0,
    stake: 0,
    potential_payout: 0,
    result: 'pending'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // Auto-calculate payout whenever stake or odds change
  useEffect(() => {
    if (formData.stake > 0 && formData.odds > 0) {
      const payout = calculatePayout(formData.stake, formData.odds)
      setFormData(prev => ({ ...prev, potential_payout: payout }))
    }
  }, [formData.stake, formData.odds])

  const calculatePayout = (stake: number, payoutMultiplier: number): number => {
    return stake * payoutMultiplier
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'odds' || name === 'stake' || name === 'potential_payout'
        ? parseFloat(value) || 0 
        : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('bets')
        .insert([formData])

      if (error) throw error

      setMessage('Bet added successfully!')
      setFormData({
        sportsbook: '',
        team_or_player: '',
        bet_amount: getTodayDate(), // Reset to today's date
        odds: 0,
        stake: 0,
        potential_payout: 0,
        result: 'pending'
      })
    } catch (error) {
      console.error('Error adding bet:', error)
      setMessage('Error adding bet. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const profit = formData.potential_payout - formData.stake

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="team_or_player" className={styles.label}>
            Pick Description
          </label>
          <input
            type="text"
            id="team_or_player"
            name="team_or_player"
            value={formData.team_or_player}
            onChange={handleInputChange}
            required
            className={styles.input}
            placeholder="e.g., Mahomes 0.5+ TDs + CMC 50+ rush yards"
          />
        </div>

        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label htmlFor="sportsbook" className={styles.label}>
              Sportsbook
            </label>
            <select
              id="sportsbook"
              name="sportsbook"
              value={formData.sportsbook}
              onChange={handleInputChange}
              required
              className={styles.select}
            >
              <option value="">Select Sportsbook</option>
              <option value="PrizePicks">PrizePicks</option>
              <option value="DraftKings">DraftKings</option>
              <option value="FanDuel">FanDuel</option>
              <option value="BetMGM">BetMGM</option>
              <option value="Caesars">Caesars</option>
              <option value="Bet365">Bet365</option>
              <option value="Fliff">Fliff</option>
              <option value="UnderDog">UnderDog</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="result" className={styles.label}>
              Result
            </label>
            <select
              id="result"
              name="result"
              value={formData.result}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        <div className={styles.inputRow}>
          <div className={styles.inputGroup}>
            <label htmlFor="stake" className={styles.label}>
              Amount ($)
            </label>
            <input
              type="number"
              id="stake"
              name="stake"
              value={formData.stake}
              onChange={handleInputChange}
              required
              step="0.01"
              min="0"
              className={styles.input}
              placeholder="50.00"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="odds" className={styles.label}>
              Payout (x)
            </label>
            <input
              type="number"
              id="odds"
              name="odds"
              value={formData.odds}
              onChange={handleInputChange}
              required
              step="0.01"
              min="1"
              className={styles.input}
              placeholder="2.25"
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="bet_amount" className={styles.label}>
            Date
          </label>
          <input
            type="date"
            id="bet_amount"
            name="bet_amount"
            value={formData.bet_amount}
            onChange={handleInputChange}
            required
            className={styles.input}
          />
        </div>

        {/* Preview Card */}
        {formData.stake > 0 && formData.odds > 0 && (
          <div className={styles.previewCard}>
            <div className={styles.previewTitle}>Bet Preview</div>
            <div className={styles.previewGrid}>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Amount</div>
                <div className={styles.previewValue}>${formData.stake.toFixed(2)}</div>
              </div>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Payout Multiplier</div>
                <div className={styles.previewValue}>{formData.odds.toFixed(2)}x</div>
              </div>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Potential Payout</div>
                <div className={styles.previewValue}>${formData.potential_payout.toFixed(2)}</div>
              </div>
              <div className={styles.previewItem}>
                <div className={styles.previewLabel}>Potential Profit</div>
                <div className={`${styles.previewValue} ${profit > 0 ? styles.profitHighlight : profit < 0 ? styles.lossHighlight : ''}`}>
                  ${profit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className={`${styles.message} ${message.includes('successfully') ? styles.messageSuccess : styles.messageError}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}
        >
          {isSubmitting ? 'Adding Bet...' : 'Add Bet'}
        </button>
      </form>
    </div>
  )
}
