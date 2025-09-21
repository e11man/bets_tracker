'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './BetHistory.module.css'

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

export default function BetHistory() {
  const [bets, setBets] = useState<BetData[]>([])
  const [filteredBets, setFilteredBets] = useState<BetData[]>([])
  const [selectedBets, setSelectedBets] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all')
  const [bulkAction, setBulkAction] = useState<'none' | 'won' | 'lost' | 'delete'>('none')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingBet, setEditingBet] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<BetData>>({})

  useEffect(() => {
    fetchBets()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [bets, filter, searchTerm])

  const fetchBets = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setBets(data || [])
    } catch (err) {
      console.error('Error fetching bets:', err)
      setError('Failed to load bet data')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = useCallback(() => {
    let filtered = bets

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(bet => bet.result === filter)
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(bet => 
        bet.team_or_player.toLowerCase().includes(search) ||
        bet.sportsbook.toLowerCase().includes(search)
      )
    }

    setFilteredBets(filtered)
  }, [bets, filter, searchTerm])

  const handleSelectBet = (betId: number) => {
    const newSelected = new Set(selectedBets)
    if (newSelected.has(betId)) {
      newSelected.delete(betId)
    } else {
      newSelected.add(betId)
    }
    setSelectedBets(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedBets.size === filteredBets.length) {
      setSelectedBets(new Set())
    } else {
      setSelectedBets(new Set(filteredBets.map(bet => bet.id)))
    }
  }

  const handleBulkAction = async () => {
    if (bulkAction === 'none' || selectedBets.size === 0) return

    try {
      const { error } = await supabase
        .from('bets')
        .update({ result: bulkAction })
        .in('id', Array.from(selectedBets))

      if (error) throw error

      await fetchBets()
      setSelectedBets(new Set())
      setBulkAction('none')
    } catch (err) {
      console.error('Error updating bets:', err)
      setError('Failed to update bets')
    }
  }

  const handleDeleteBet = async (betId: number) => {
    if (!confirm('Are you sure you want to delete this bet?')) return

    try {
      const { error } = await supabase
        .from('bets')
        .delete()
        .eq('id', betId)

      if (error) throw error

      await fetchBets()
    } catch (err) {
      console.error('Error deleting bet:', err)
      setError('Failed to delete bet')
    }
  }

  const handleUpdateResult = async (betId: number, newResult: 'won' | 'lost' | 'pending') => {
    try {
      const { error } = await supabase
        .from('bets')
        .update({ result: newResult })
        .eq('id', betId)

      if (error) throw error

      await fetchBets()
    } catch (err) {
      console.error('Error updating bet:', err)
      setError('Failed to update bet')
    }
  }

  const startEdit = (bet: BetData) => {
    setEditingBet(bet.id)
    setEditForm({
      team_or_player: bet.team_or_player,
      sportsbook: bet.sportsbook,
      stake: bet.stake,
      odds: bet.odds,
      bet_amount: bet.bet_amount,
      result: bet.result
    })
  }

  const cancelEdit = () => {
    setEditingBet(null)
    setEditForm({})
  }

  const saveEdit = async () => {
    if (!editingBet) return

    try {
      // Calculate new potential payout
      const potential_payout = (editForm.stake || 0) * (editForm.odds || 0)
      
      const { error } = await supabase
        .from('bets')
        .update({
          ...editForm,
          potential_payout,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingBet)

      if (error) throw error

      await fetchBets()
      setEditingBet(null)
      setEditForm({})
    } catch (err) {
      console.error('Error updating bet:', err)
      setError('Failed to update bet')
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
        <p>Loading bet history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={fetchBets} className={styles.retryButton}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={styles.historyContainer}>
      <h3 className={styles.historyTitle}>Bet History</h3>

      {/* Search and Filters */}
      <div className={styles.controlsSection}>
        {/* Search Bar */}
        <div className={styles.searchControls}>
          <input
            type="text"
            placeholder="Search bets or sportsbooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={styles.clearSearch}
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterControls}>
            <label className={styles.filterLabel}>Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'won' | 'lost')}
              className={styles.filterSelect}
            >
              <option value="all">All Bets</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {selectedBets.size > 0 && (
            <div className={styles.bulkControls}>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as 'won' | 'lost' | 'delete')}
                className={styles.bulkSelect}
              >
                <option value="none">Bulk Action</option>
                <option value="won">Mark as Won</option>
                <option value="lost">Mark as Lost</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={bulkAction === 'none'}
                className={styles.bulkButton}
              >
                Apply ({selectedBets.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className={styles.resultsInfo}>
        Showing {filteredBets.length} of {bets.length} bets
        {searchTerm && <span> for &quot;{searchTerm}&quot;</span>}
      </div>

      {/* Bet List */}
      <div className={styles.betList}>
        {filteredBets.length === 0 ? (
          <div className={styles.noBets}>
            <p>{searchTerm ? 'No bets found matching your search' : 'No bets found'}</p>
          </div>
        ) : (
          <>
            {filteredBets.map((bet) => (
              <div key={bet.id} className={styles.betCard}>
                {editingBet === bet.id ? (
                  // Edit Mode
                  <div className={styles.editCard}>
                    <div className={styles.editHeader}>
                      <h4>Edit Bet</h4>
                      <div className={styles.editActions}>
                        <button onClick={saveEdit} className={styles.saveButton}>
                          Save
                        </button>
                        <button onClick={cancelEdit} className={styles.cancelButton}>
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div className={styles.editForm}>
                      <div className={styles.editField}>
                        <label>Pick Description</label>
                        <input
                          type="text"
                          value={editForm.team_or_player || ''}
                          onChange={(e) => setEditForm({...editForm, team_or_player: e.target.value})}
                          className={styles.editInput}
                        />
                      </div>
                      <div className={styles.editRow}>
                        <div className={styles.editField}>
                          <label>Sportsbook</label>
                          <select
                            value={editForm.sportsbook || ''}
                            onChange={(e) => setEditForm({...editForm, sportsbook: e.target.value})}
                            className={styles.editSelect}
                          >
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
                        <div className={styles.editField}>
                          <label>Result</label>
                          <select
                            value={editForm.result || ''}
                            onChange={(e) => setEditForm({...editForm, result: e.target.value as 'pending' | 'won' | 'lost'})}
                            className={styles.editSelect}
                          >
                            <option value="pending">Pending</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>
                      </div>
                      <div className={styles.editRow}>
                        <div className={styles.editField}>
                          <label>Amount ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.stake || ''}
                            onChange={(e) => setEditForm({...editForm, stake: parseFloat(e.target.value) || 0})}
                            className={styles.editInput}
                          />
                        </div>
                        <div className={styles.editField}>
                          <label>Multiplier</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.odds || ''}
                            onChange={(e) => setEditForm({...editForm, odds: parseFloat(e.target.value) || 0})}
                            className={styles.editInput}
                          />
                        </div>
                      </div>
                      <div className={styles.editField}>
                        <label>Date</label>
                        <input
                          type="date"
                          value={editForm.bet_amount || ''}
                          onChange={(e) => setEditForm({...editForm, bet_amount: e.target.value})}
                          className={styles.editInput}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className={styles.betCardHeader}>
                      <div className={styles.betCardTitle}>
                        <input
                          type="checkbox"
                          checked={selectedBets.has(bet.id)}
                          onChange={() => handleSelectBet(bet.id)}
                          className={styles.checkbox}
                        />
                        <span className={styles.betName}>{bet.team_or_player}</span>
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          onClick={() => startEdit(bet)}
                          className={styles.editButton}
                          title="Edit bet"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteBet(bet.id)}
                          className={styles.deleteButton}
                          title="Delete bet"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className={styles.betCardContent}>
                      <div className={styles.betInfoGrid}>
                        <div className={styles.betInfoItem}>
                          <span className={styles.betInfoLabel}>Sportsbook</span>
                          <span className={styles.betInfoValue}>{bet.sportsbook}</span>
                        </div>
                        
                        <div className={styles.betInfoItem}>
                          <span className={styles.betInfoLabel}>Amount</span>
                          <span className={styles.betInfoValue}>${bet.stake.toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.betInfoItem}>
                          <span className={styles.betInfoLabel}>Multiplier</span>
                          <span className={styles.betInfoValue}>{bet.odds.toFixed(2)}x</span>
                        </div>
                        
                        <div className={styles.betInfoItem}>
                          <span className={styles.betInfoLabel}>Payout</span>
                          <span className={styles.betInfoValue}>${bet.potential_payout.toFixed(2)}</span>
                        </div>
                        
                        <div className={styles.betInfoItem}>
                          <span className={styles.betInfoLabel}>Date</span>
                          <span className={styles.betInfoValue}>{formatDate(bet.bet_amount)}</span>
                        </div>
                        
                        <div className={styles.betInfoItem}>
                          <span className={styles.betInfoLabel}>Result</span>
                          <select
                            value={bet.result}
                            onChange={(e) => handleUpdateResult(bet.id, e.target.value as 'pending' | 'won' | 'lost')}
                            className={`${styles.resultSelect} ${styles[bet.result]}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Summary */}
      <div className={styles.summarySection}>
        <div className={styles.summaryStats}>
          <span>Total: {filteredBets.length}</span>
          <span>Pending: {filteredBets.filter(b => b.result === 'pending').length}</span>
          <span>Won: {filteredBets.filter(b => b.result === 'won').length}</span>
          <span>Lost: {filteredBets.filter(b => b.result === 'lost').length}</span>
        </div>
      </div>
    </div>
  )
}
