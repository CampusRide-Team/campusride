import React, { useState } from 'react'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Car, 
  User, 
  BarChart3, 
  Shield,
  RefreshCw,
  MapPin
} from 'lucide-react'
import api from '../api/axios'
import bgImage from '../assets/background.jpg'

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password.trim(),
        role: 'admin'
      })

      const result = response.data

      if (result.success) {
        if (result.data?.token) {
          localStorage.setItem('adminToken', result.data.token)
        }
        onLoginSuccess?.(result.data?.user)
      } else {
        setError(result.error?.message || 'Invalid administrative credentials.')
      }
    } catch (err) {
      console.error('Admin login error:', err)
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Unable to connect to the server. Please try again.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      {/* ===================== LEFT CONTENT PANEL ===================== */}
      <div style={s.left}>
        <div style={{ ...s.leftPhoto, backgroundImage: `url(${bgImage})` }} />
        <div style={s.leftOverlay} />

        <svg style={s.wave} viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path 
            d="M0,80 C360,140 720,20 1080,70 C1260,95 1380,90 1440,80 L1440,120 L0,120 Z" 
            fill="#ffffff" 
            opacity="1"
          />
        </svg>

        <div style={s.leftContent}>
          <h1 style={s.headline}>
            Smarter Campus<br />
            <span style={{ color: '#60A5FA' }}>Mobility Management</span>
          </h1>

          <p style={s.sub}>
            Monitor rides, manage drivers, track activity<br />
            and keep the campus moving — all from<br />
            one powerful dashboard.
          </p>

          <div style={s.features}>
            {[
              { icon: <Car size={15} color="#fff" />, title: 'Live Ride Tracking', desc: 'Monitor active rides and driver locations in real-time.' },
              { icon: <User size={15} color="#fff" />, title: 'Driver Management', desc: 'Verify drivers and manage operator activities.' },
              { icon: <BarChart3 size={15} color="#fff" />, title: 'Actionable Insights', desc: 'Track demand, performance and campus hotspots.' },
              { icon: <Shield size={15} color="#fff" />, title: 'Safer Campus', desc: 'Better coordination for a safer ride experience.' }
            ].map((f, i) => (
              <div key={i} style={s.feature}>
                <div style={s.featureIcon}>{f.icon}</div>
                <div>
                  <div style={s.featureTitle}>{f.title}</div>
                  <div style={s.featureDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={s.uni}>
            <span style={{ fontSize: 15 }}>🎓</span>
            <div>
              <div style={s.uniName}>University of Ghana, Legon Campus</div>
              <div style={s.uniTag}>SAFE  •  RELIABLE  •  CONNECTED</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== RIGHT FORM PANEL ===================== */}
      <div style={s.right}>
        <div style={s.blobTop} />
        <div style={s.blobBottom} />

        <div style={s.card}>
          <div style={s.logoSection}>
            <div style={s.logoCircle}>
              <MapPin size={22} color="#fff" strokeWidth={2.5} />
              <Car size={12} color="#fff" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            </div>
            <div style={s.logoText}>
              Campus<span style={{ color: '#2563EB' }}>Ride</span>
            </div>
            <div style={s.logoSub}>ADMIN PORTAL</div>
          </div>

          <h2 style={s.welcome}>Welcome Back</h2>
          <p style={s.welcomeSub}>Log in to your admin account to continue</p>

          {error && (
            <div style={s.error}>
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} style={s.form}>
            <div style={s.field}>
              <Mail size={16} color="#94A3B8" style={s.fieldIcon} />
              <input
                type="email"
                placeholder="Enter your Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={s.input}
                disabled={loading}
              />
            </div>

            <div style={s.field}>
              <Lock size={16} color="#94A3B8" style={s.fieldIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={s.input}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={s.eye}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
              </button>
            </div>

            <div style={s.row}>
              <label style={s.checkLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={s.check}
                  disabled={loading}
                />
                Remember me
              </label>
            </div>

            <button type="submit" style={s.submit} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw size={17} style={{ animation: 'spin 1s linear infinite' }} />
                  Signing in…
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <div style={s.footer}>
            <div style={s.secure}>
              <Shield size={13} color="#94A3B8" />
              <div>
                <div style={s.secureTitle}>Secure Access</div>
                <div style={s.secureSub}>Protected and monitored</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background-color: #0B1F5C;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus {
          border-color: #2563EB !important;
          background: #fff !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      `}</style>
    </div>
  )
}

const s = {
  page: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    height: '100vh',
    width: '100vw',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    background: '#F8FAFC',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    boxSizing: 'border-box'
  },

  left: {
    flex: '1.45',
    height: '100vh',
    position: 'relative',
    background: '#0B1F5C',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    color: '#fff',
    boxSizing: 'border-box'
  },
  leftPhoto: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'right 30% bottom 18%',
    opacity: 1,
    filter: 'none'
  },
  leftOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(11,31,92,0.65) 0%, rgba(30,58,138,0.3) 40%, rgba(11,31,92,0.1) 100%)'
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 90,
    zIndex: 2
  },
  leftContent: {
    position: 'relative',
    zIndex: 4,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    padding: '64px 52px 36px',
    boxSizing: 'border-box',
    overflowY: 'auto'
  },
  headline: {
    fontSize: 40,
    fontWeight: 800,
    lineHeight: 1.18,
    margin: '0 0 16px',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
  },
  sub: {
    fontSize: 14.5,
    lineHeight: 1.55,
    opacity: 0.95,
    margin: '0 0 36px',
    maxWidth: 360,
    textShadow: '0 1px 6px rgba(0,0,0,0.3)'
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    marginBottom: 'auto'
  },
  feature: {
    display: 'flex',
    gap: 13,
    alignItems: 'flex-start'
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 1
  },
  featureDesc: {
    fontSize: 12.5,
    opacity: 0.88,
    lineHeight: 1.4
  },
  uni: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 32
  },
  uniName: {
    fontSize: 13,
    fontWeight: 600
  },
  uniTag: {
    fontSize: 11,
    opacity: 0.8,
    letterSpacing: '0.5px',
    marginTop: 1
  },

  right: {
    flex: 1,
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 32px',
    background: '#F8FAFC',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  blobTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(147,197,253,0.25) 0%, transparent 70%)',
    zIndex: 1
  },
  blobBottom: {
    position: 'absolute',
    bottom: -60,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(191,219,254,0.2) 0%, transparent 70%)',
    zIndex: 1
  },

  card: {
    width: '100%',
    maxWidth: 460,
    background: '#ffffff',
    borderRadius: 28,
    padding: '44px 42px 36px',
    boxShadow: '0 20px 40px -12px rgba(15,23,42,0.12), 0 0 0 1px rgba(226,232,240,0.9)',
    position: 'relative',
    zIndex: 4,
    boxSizing: 'border-box'
  },

  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 28
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
    boxShadow: '0 8px 20px rgba(37,99,235,0.35)'
  },
  logoText: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.3px'
  },
  logoSub: {
    fontSize: 11,
    fontWeight: 600,
    color: '#94A3B8',
    letterSpacing: '0.18em',
    marginTop: 3
  },

  welcome: {
    fontSize: 26,
    fontWeight: 800,
    color: '#0F172A',
    textAlign: 'center',
    margin: '0 0 6px'
  },
  welcomeSub: {
    fontSize: 14.5,
    color: '#64748B',
    textAlign: 'center',
    margin: '0 0 28px'
  },
  error: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 12,
    padding: '12px 14px',
    marginBottom: 16,
    fontSize: 13.5,
    color: '#B91C1C',
    fontWeight: 600,
    lineHeight: 1.4
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  field: {
    position: 'relative'
  },
  fieldIcon: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none'
  },
  input: {
    width: '100%',
    height: 52,
    padding: '0 46px 0 46px',
    borderRadius: 14,
    border: '1px solid #E2E8F0',
    fontSize: 15,
    color: '#0F172A',
    outline: 'none',
    background: '#F8FAFC',
    boxSizing: 'border-box',
    transition: 'all 0.15s ease'
  },
  eye: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '2px 0 4px'
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    fontSize: 14,
    color: '#334155',
    fontWeight: 500,
    cursor: 'pointer'
  },
  check: {
    width: 16,
    height: 16,
    accentColor: '#2563EB',
    cursor: 'pointer'
  },
  submit: {
    height: 52,
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    color: '#fff',
    fontSize: 15.5,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    marginTop: 10,
    boxShadow: '0 6px 16px rgba(37,99,235,0.35)',
    transition: 'all 0.15s ease'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTop: '1px solid #F1F5F9'
  },
  secure: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  secureTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#334155'
  },
  secureSub: {
    fontSize: 11.5,
    color: '#94A3B8'
  }
}