import React, { useState } from 'react'
import { Shield, Mail, Lock, RefreshCw } from 'lucide-react'

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Set this to true once you hook up your actual backend database
    const isProductionReady = false; 

    try {
      if (isProductionReady) {
         // const response = await api.post('/admin/auth/login', { email, password })
        // if (response.data?.success) {
        //   onLoginSuccess?.(response.data.user)
        // }
      } else {
        //  Hardcoded Development Credentials Handshake (admin1@gmail.com / 24680)
        setTimeout(() => {
          if (email.trim() === 'admin1@gmail.com' && password === '24680') {
            onLoginSuccess?.()
          } else {
            setError('Invalid administrative credentials payload or cryptographic token mismatch.')
            setLoading(false)
          }
        }, 1000)
      }
    } catch (err) {
      console.error("Secure auth handshake exception:", err)
      setError('Network validation failure. Failed executing secure auth socket handshake.')
      setLoading(false)
    }
  }

  return (
    <div style={lgStyles.viewportShellWrapper}>
      <div style={lgStyles.loginContainerCard}>

        {/* BRAND IDENTITY TOP BLOCK */}
        <div style={lgStyles.brandHeaderBlock}>
          <div style={lgStyles.brandIconBadge}>
            <Shield size={24} color="#ffffff" />
          </div>
          <h1 style={lgStyles.brandNameTitle}>CampusRide</h1>
          <p style={lgStyles.brandSubTitle}>ADMIN SECURE ACCESS GATEWAY</p>
        </div>

        {/* REACTIONARY ERROR BLOCK */}
        {error && (
          <div style={lgStyles.errorMessageBoxBanner}>
            <span style={lgStyles.errorTextFont}>{error}</span>
          </div>
        )}

        {/* AUTHENTICATION INPUT INTERFACE FORM */}
        <form onSubmit={handleFormSubmit} style={lgStyles.formStackLayout}>
          <div style={lgStyles.inputUnitBlock}>
            <label style={lgStyles.inputLabelFieldTitle}>Administrative Email</label>
            <div style={lgStyles.inputFieldWrapperRow}>
              <Mail size={16} color="#94A3B8" style={lgStyles.inputContextIcon} />
              <input 
                type="email" 
                placeholder="e.g. admin1@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={lgStyles.standardTextInputField} 
              />
            </div>
          </div>

          <div style={lgStyles.inputUnitBlock}>
            <label style={lgStyles.inputLabelFieldTitle}>Secret Password Token</label>
            <div style={lgStyles.inputFieldWrapperRow}>
              <Lock size={16} color="#94A3B8" style={lgStyles.inputContextIcon} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={lgStyles.standardTextInputField} 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={lgStyles.submitActionButtonMarkup}>
            {loading ? (
              <>
                <RefreshCw size={14} style={lgStyles.spinAnimationClassAsset} />
                <span>Transmission Sync...</span>
              </>
            ) : (
              'Authenticate Credentials'
            )}
          </button>
        </form>

        <div style={lgStyles.footerNoticeBlock}>
          <p style={lgStyles.footerNoticeText}>Authorized Access Only • System Activities Are Logged Monitored</p>
        </div>

      </div>
    </div>
  )
}

const lgStyles = {
  viewportShellWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'fixed',
    inset: 0,
    height: '100vh',
    width: '100vw',
    backgroundColor: '#F8FAFC',
    boxSizing: 'border-box',
    overflow: 'hidden',
    touchAction: 'none',
    fontFamily: 'Inter, sans-serif',
    margin: 0,
    padding: 0
  },
  loginContainerCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 10px 25px -5px rgba(15,23,42,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    boxSizing: 'border-box'
  },
  brandHeaderBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  brandIconBadge: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    backgroundColor: '#1E3A8A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(30,58,138,0.2)'
  },
  brandNameTitle: {
    fontSize: '24px',
    fontWeight: 900,
    color: '#1E3A8A',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  brandSubTitle: {
    fontSize: '9px',
    fontWeight: 800,
    color: '#94A3B8',
    letterSpacing: '1.5px',
    margin: 0
  },
  errorMessageBoxBanner: {
    backgroundColor: '#FFF5F5',
    border: '1px solid #FCA5A5',
    borderRadius: '12px',
    padding: '12px 14px',
    textAlign: 'left'
  },
  errorTextFont: {
    fontSize: '12px',
    color: '#991B1B',
    fontWeight: 600,
    lineHeight: '1.4'
  },
  formStackLayout: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%'
  },
  inputUnitBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left',
    width: '100%'
  },
  inputLabelFieldTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  inputFieldWrapperRow: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  },
  inputContextIcon: {
    position: 'absolute',
    left: '14px',
    pointerEvents: 'none'
  },
  standardTextInputField: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '12px 14px 12px 40px',
    fontSize: '13px',
    color: '#334155',
    fontWeight: 600,
    outline: 'none',
    transition: 'border-color 0.15s ease'
  },
  submitActionButtonMarkup: {
    backgroundColor: '#1E3A8A',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 0',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    outline: 'none',
    boxShadow: '0 4px 12px rgba(30,58,138,0.15)',
    transition: 'opacity 0.15s ease',
    marginTop: '4px'
  },
  footerNoticeBlock: {
    borderTop: '1px solid #F1F5F9',
    paddingTop: '16px',
    textAlign: 'center'
  },
  footerNoticeText: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: '0.2px',
    margin: 0,
    lineHeight: '1.4'
  },
  spinAnimationClassAsset: {
    animation: 'spin 1s linear infinite'
  }
}