import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, Trophy, Users, Star, Zap } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loaded, setLoaded] = useState(false)

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Redirect if logged in
  useEffect(() => {
    if (session) {
      // Check if user has 'Joueur' role and redirect to player space
      const hasPlayerRole = session.user.roles?.some((role: { name: string }) => role.name === 'Joueur')
      if (hasPlayerRole && session.user.roles?.length === 1) {
        router.push('/player')
      } else {
        router.push('/admin')
      }
    }
  }, [session, router])

  useEffect(() => {
    const error = router.query?.error
    if (error === 'CredentialsSignin') {
      setLoginError(t('auth.invalidCredentials') || 'Identifiants invalides')
      const rest = { ...router.query }
      delete rest.error
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true })
    }
  }, [router, t])

  // Prevent flash if logged in
  if (session) {
    return (
      <div className="club-loading">
        <div className="club-spinner" />
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    if (result?.error) {
      setLoginError(t('auth.invalidCredentials') || 'Identifiants invalides')
      return
    }
    if (result?.ok) {
      router.push('/admin')
    }
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .club-page {
          min-height: 100vh;
          display: flex;
          font-family: 'Outfit', sans-serif;
          background: #3b3a3aff;
          overflow: hidden;
          position: relative;
        }

        /* ─── Animated background orbs ─── */
        .club-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .club-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          animation: orbFloat 8s ease-in-out infinite alternate;
        }
        .club-orb-1 { width: 600px; height: 600px; background: #7C3AED; top: -200px; left: -150px; animation-delay: 0s; }
        .club-orb-2 { width: 500px; height: 500px; background: #DB2777; bottom: -200px; right: -100px; animation-delay: 3s; }
        .club-orb-3 { width: 350px; height: 350px; background: #F59E0B; top: 40%; left: 40%; animation-delay: 1.5s; }

        @keyframes orbFloat {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -30px) scale(1.05); }
        }

        /* ─── Grid overlay ─── */
        .club-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image:
            linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* ─── Left Panel ─── */
        .club-left {
          display: none;
          position: relative;
          z-index: 10;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          overflow: hidden;
        }
        @media (min-width: 1024px) {
          .club-left { display: flex; width: 55%; }
        }

        .club-left-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0D0A1A 0%, #12082A 50%, #0A0714 100%);
          z-index: 0;
        }
        .club-left-border {
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(124,58,237,0.6), rgba(219,39,119,0.6), transparent);
          z-index: 5;
        }

        /* Hero image */
        .club-hero-img {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .club-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(6,7,13,0.15) 0%, rgba(6,7,13,0.6) 100%),
                      linear-gradient(to top, rgba(6,7,13,0.9) 0%, transparent 50%);
          z-index: 2;
        }

        /* Content inside left panel */
        .club-left-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }

        /* Logo badge */
        .club-logo-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.3);
          border-radius: 9999px;
          padding: 0.5rem 1.25rem;
          backdrop-filter: blur(8px);
          width: fit-content;
        }
        .club-logo-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #A855F7;
          box-shadow: 0 0 8px #A855F7;
          animation: pulse 2s ease infinite;
        }
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.6; transform:scale(0.85); }
        }
        .club-logo-text {
          font-size: 0.85rem;
          font-weight: 600;
          color: #C4B5FD;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* Headline */
        .club-headline {
          font-size: clamp(2.8rem, 5vw, 4.5rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .club-headline-gradient {
          background: linear-gradient(90deg, #A855F7, #EC4899, #F59E0B);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .club-desc {
          font-size: 1.05rem;
          color: rgba(255,255,255,0.55);
          line-height: 1.75;
          font-weight: 400;
          max-width: 480px;
        }

        /* Stats bar */
        .club-stats {
          display: flex;
          gap: 2rem;
          padding: 1.5rem 2rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1rem;
          backdrop-filter: blur(12px);
        }
        .club-stat { display: flex; flex-direction: column; gap: 0.2rem; }
        .club-stat-num {
          font-size: 1.6rem;
          font-weight: 800;
          color: #fff;
        }
        .club-stat-num span { color: #A855F7; }
        .club-stat-label {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .club-stat-divider {
          width: 1px;
          background: rgba(255,255,255,0.08);
          align-self: stretch;
        }

        /* Feature pills */
        .club-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .club-feature-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px;
          padding: 0.5rem 1rem;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.65);
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .club-feature-pill:hover {
          background: rgba(124,58,237,0.15);
          border-color: rgba(124,58,237,0.4);
          color: #C4B5FD;
        }
        .club-feature-pill svg { color: #A855F7; }

        /* ─── Right panel (Login) ─── */
        .club-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          z-index: 10;
        }

        .club-form-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1.5rem;
          padding: 2.5rem;
          backdrop-filter: blur(20px);
          box-shadow: 0 0 80px rgba(124,58,237,0.1);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        /* Logo top of form */
        .club-form-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .club-form-logo-img {
          position: relative;
          width: 160px;
          height: 64px;
        }
        .club-form-logo-subtitle {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.4);
          font-weight: 400;
          text-align: center;
          letter-spacing: 0.02em;
        }

        /* Divider with welcome text */
        .club-welcome-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.75rem;
        }
        .club-welcome-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }
        .club-welcome-text {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 600;
          white-space: nowrap;
        }

        /* Form inputs */
        .club-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .club-input-wrap { position: relative; margin-bottom: 1.25rem; }
        .club-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .club-input::placeholder { color: rgba(255,255,255,0.2); }
        .club-input:focus {
          border-color: rgba(124,58,237,0.6);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
          background: rgba(124,58,237,0.06);
        }
        .club-input:hover:not(:focus) {
          border-color: rgba(255,255,255,0.18);
        }
        .club-pw-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.3);
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .club-pw-toggle:hover { color: rgba(255,255,255,0.8); }

        /* Remember + Forgot row */
        .club-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.75rem;
        }
        .club-remember {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .club-remember input[type="checkbox"] {
          width: 16px; height: 16px;
          accent-color: #7C3AED;
          cursor: pointer;
          border-radius: 4px;
        }
        .club-remember-label {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.45);
          font-weight: 400;
          cursor: pointer;
          user-select: none;
        }
        .club-forgot {
          font-size: 0.82rem;
          font-weight: 600;
          color: #A855F7;
          text-decoration: none;
          transition: color 0.2s;
        }
        .club-forgot:hover { color: #C084FC; }

        /* Error message */
        .club-error {
          background: rgba(220,38,38,0.1);
          border: 1px solid rgba(220,38,38,0.25);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          color: #FCA5A5;
          margin-bottom: 1.25rem;
        }

        /* Submit button */
        .club-btn {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 0.75rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #7C3AED, #DB2777);
          box-shadow: 0 4px 24px rgba(124,58,237,0.4);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .club-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .club-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(124,58,237,0.55);
        }
        .club-btn:hover::before { opacity: 1; }
        .club-btn:active { transform: translateY(0); }

        /* Loading state */
        .club-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #06070D;
        }
        .club-spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(124,58,237,0.2);
          border-top-color: #A855F7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Entrance animation */
        .club-form-card.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .club-form-card.hidden-start {
          opacity: 0;
          transform: translateY(20px);
        }
      `}</style>

      <div className="club-page">
        {/* Background elements */}
        <div className="club-bg">
          <div className="club-orb club-orb-1" />
          <div className="club-orb club-orb-2" />
          <div className="club-orb club-orb-3" />
        </div>
        <div className="club-grid" />

        {/* ─── Left branding panel ─── */}
        <div className="club-left">
          <div className="club-left-bg" />
          <div className="club-left-border" />

          {/* Optional hero image */}
          <div className="club-hero-img">
            <Image
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=1200"
              alt="Club Background"
              fill
              className="object-cover"
              style={{ opacity: 0.25 }}
              priority
            />
          </div>
          <div className="club-hero-overlay" />

          <div className="club-left-content">
            {/* Top: badge + logo */}
            <div>
              <div className="club-logo-badge">
                <div className="club-logo-dot" />
                <span className="club-logo-text">Espace Membres</span>
              </div>
            </div>

            {/* Middle: headline + desc */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h1 className="club-headline">
                Bienvenue dans<br />
                votre <span className="club-headline-gradient">Club</span>
              </h1>
              <p className="club-desc">
                {t('auth.appDescription') || "Accédez à votre espace membre exclusif. Gérez vos activités, suivez vos performances et restez connecté avec votre communauté."}
              </p>

              <div className="club-features">
                <div className="club-feature-pill">
                  <Trophy size={14} />
                  Compétitions
                </div>
                <div className="club-feature-pill">
                  <Users size={14} />
                  Membres actifs
                </div>
                <div className="club-feature-pill">
                  <Star size={14} />
                  Événements
                </div>
                <div className="club-feature-pill">
                  <Zap size={14} />
                  Entraînements
                </div>
              </div>
            </div>

            {/* Bottom: stats */}
            <div className="club-stats">
              <div className="club-stat">
                <div className="club-stat-num">1<span>+</span></div>
                <div className="club-stat-label">Club</div>
              </div>
              <div className="club-stat-divider" />
              <div className="club-stat">
                <div className="club-stat-num">500<span>+</span></div>
                <div className="club-stat-label">Membres</div>
              </div>
              <div className="club-stat-divider" />
              <div className="club-stat">
                <div className="club-stat-num">50<span>+</span></div>
                <div className="club-stat-label">Activités</div>
              </div>
              <div className="club-stat-divider" />
              <div className="club-stat">
                <div className="club-stat-num">24<span>/7</span></div>
                <div className="club-stat-label">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right login panel ─── */}
        <div className="club-right">
          <div className={`club-form-card ${loaded ? 'visible' : 'hidden-start'}`}>

            {/* Subtitle */}
            <div className="club-form-logo">
              <p className="club-form-logo-subtitle">
                {t('auth.enterDetails') || 'Connectez-vous à votre espace membre'}
              </p>
            </div>

            {/* Divider */}
            <div className="club-welcome-bar">
              <div className="club-welcome-line" />
              <span className="club-welcome-text">Connexion membre</span>
              <div className="club-welcome-line" />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin}>
              {loginError && (
                <div className="club-error">{loginError}</div>
              )}

              {/* Email */}
              <div>
                <label className="club-label">{t('email') || 'Adresse e-mail'}</label>
                <div className="club-input-wrap">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="membre@club.com"
                    className="club-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="club-label">{t('password') || 'Mot de passe'}</label>
                <div className="club-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="club-input"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="club-pw-toggle"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="club-row">
                <label className="club-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  <span className="club-remember-label">
                    {t('auth.rememberMe') || 'Rester connecté'}
                  </span>
                </label>
                <Link href="/auth/forgot-password" className="club-forgot">
                  {t('auth.forgotPassword') || 'Mot de passe oublié ?'}
                </Link>
              </div>

              <button type="submit" className="club-btn">
                {t('auth.signIn') || 'Se connecter'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Link href="/inscription" style={{ color: '#A855F7', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                  Nouveau joueur ? Créer une fiche d&apos;inscription
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
