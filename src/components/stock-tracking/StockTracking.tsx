'use client'

import { useState } from 'react'
import StockInputForm from './StockInputForm'
import StockAnalytics from './StockAnalytics'
import StockHistory from './StockHistory'
import styles from './StockTracking.module.css'

export default function StockTracking() {
  const [activeTab, setActiveTab] = useState('place-trade')

  return (
    <div className={styles.stockTrackingContainer}>
      <div className={styles.tabHeader}>
        <button
          className={`${styles.tabButton} ${activeTab === 'place-trade' ? styles.active : ''}`}
          onClick={() => setActiveTab('place-trade')}
        >
          Place Trade
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'performance-analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('performance-analytics')}
        >
          Performance Analytics
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'trade-history' ? styles.active : ''}`}
          onClick={() => setActiveTab('trade-history')}
        >
          Trade History
        </button>
      </div>
      <div className={styles.tabContent}>
        {activeTab === 'place-trade' && <StockInputForm />}
        {activeTab === 'performance-analytics' && <StockAnalytics />}
        {activeTab === 'trade-history' && <StockHistory />}
      </div>
    </div>
  )
}
