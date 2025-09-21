import MainNavigation from '@/components/MainNavigation'

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      padding: '1rem 0.5rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '100%', 
        margin: '0 auto',
        textAlign: 'center',
        padding: '0 0.5rem'
      }}>
        <div style={{
          marginBottom: '2rem',
          opacity: 1,
          transform: 'translateY(0)',
          transition: 'all 0.6s ease-out'
        }}>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: '800',
            color: '#1E293B',
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em'
          }}>
            Trading Tracker
          </h1>
          <p style={{
            fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
            color: '#64748B',
            fontWeight: '500',
            margin: 0
          }}>
            Track your sports bets and day trading with precision
          </p>
        </div>
        <MainNavigation />
      </div>
    </div>
  )
}