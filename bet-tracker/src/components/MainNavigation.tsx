'use client'

import { useState } from 'react'
import BetTracking from './bet-tracking/BetTracking'
import StockTracking from './stock-tracking/StockTracking'
import styles from './MainNavigation.module.css'

export default function MainNavigation() {
  const [activeSection, setActiveSection] = useState('bets')

  return (
    <div className={styles.mainContainer}>
      {/* Main Navigation */}
      <div className={styles.navHeader}>
        <button
          className={`${styles.navButton} ${activeSection === 'bets' ? styles.active : ''}`}
          onClick={() => setActiveSection('bets')}
        >
          <span className={styles.navIcon}>🎯</span>
          <span className={styles.navLabel}>Sports Betting</span>
        </button>
        <button
          className={`${styles.navButton} ${activeSection === 'stocks' ? styles.active : ''}`}
          onClick={() => setActiveSection('stocks')}
        >
          <span className={styles.navIcon}>📈</span>
          <span className={styles.navLabel}>Day Trading</span>
        </button>
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {activeSection === 'bets' && <BetTracking />}
        {activeSection === 'stocks' && <StockTracking />}
      </div>
    </div>
  )
}
