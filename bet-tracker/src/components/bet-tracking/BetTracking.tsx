'use client'

import { useState } from 'react'
import BetInputForm from './BetInputForm'
import ROIAnalytics from './ROIAnalytics'
import BetHistory from './BetHistory'
import styles from './BetTracking.module.css'

export default function BetTracking() {
  const [activeTab, setActiveTab] = useState('place-bet')

  return (
    <div className={styles.betTrackingContainer}>
      <div className={styles.tabHeader}>
        <button
          className={`${styles.tabButton} ${activeTab === 'place-bet' ? styles.active : ''}`}
          onClick={() => setActiveTab('place-bet')}
        >
          Place Bet
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'roi-analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('roi-analytics')}
        >
          ROI Analytics
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'bet-history' ? styles.active : ''}`}
          onClick={() => setActiveTab('bet-history')}
        >
          Bet History
        </button>
      </div>
      <div className={styles.tabContent}>
        {activeTab === 'place-bet' && <BetInputForm />}
        {activeTab === 'roi-analytics' && <ROIAnalytics />}
        {activeTab === 'bet-history' && <BetHistory />}
      </div>
    </div>
  )
}
