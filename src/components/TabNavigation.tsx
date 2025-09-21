'use client'

import { useState } from 'react'
import BetInputForm from './BetInputForm'
import ROIAnalytics from './ROIAnalytics'
import BetHistory from './BetHistory'
import styles from './TabNavigation.module.css'

export default function TabNavigation() {
  const [activeTab, setActiveTab] = useState<'place' | 'analytics' | 'history'>('place')

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabHeader}>
        <button
          className={`${styles.tabButton} ${activeTab === 'place' ? styles.active : ''}`}
          onClick={() => setActiveTab('place')}
        >
          Place Bet
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          ROI Analytics
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Bet History
        </button>
      </div>
      
      <div className={styles.tabContent}>
        {activeTab === 'place' && <BetInputForm />}
        {activeTab === 'analytics' && <ROIAnalytics />}
        {activeTab === 'history' && <BetHistory />}
      </div>
    </div>
  )
}