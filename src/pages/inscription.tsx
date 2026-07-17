import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Users, Star, Upload, UserPlus } from 'lucide-react'
import Image from 'next/image'

export default function RegisterPlayer() {
  const [loaded, setLoaded] = useState(false)
  
  // Player data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    licenseNumber: '',
    category: '',
    bloodGroup: '',
    height: '',
    weight: '',
    medicalCert: '',
    idScan: '',
  })

  // File states (mock)
  const [medicalCert, setMedicalCert] = useState<File | null>(null)
  const [idScan, setIdScan] = useState<File | null>(null)

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'medical' | 'id') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      if (type === 'medical') {
        setMedicalCert(file)
        setFormData(prev => ({ ...prev, medicalCert: file.name }))
      } else {
        setIdScan(file)
        setFormData(prev => ({ ...prev, idScan: file.name }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const toBase64 = (file: File) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })

    try {
      let medicalCertBase64 = null
      let idScanBase64 = null
      
      if (medicalCert) medicalCertBase64 = await toBase64(medicalCert)
      if (idScan) idScanBase64 = await toBase64(idScan)

      const payload = {
        ...formData,
        medicalCertBase64,
        idScanBase64
      }

      const res = await fetch('/api/players/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Erreur lors de l'inscription")
      }

      alert('Inscription réussie ! Vos informations ont bien été enregistrées.')
      // Optional: Redirect to home or reset form
      window.location.href = '/'
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert('Erreur: ' + errorMessage)
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
          background: #06070D;
          overflow: hidden;
          position: relative;
        }

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
          .club-left { display: flex; width: 45%; }
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

        .club-left-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }

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

        .club-headline {
          font-size: clamp(2.5rem, 4vw, 3.5rem);
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

        .club-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          z-index: 10;
          overflow-y: auto;
        }

        .club-form-card {
          width: 100%;
          max-width: 600px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1.5rem;
          padding: 2.5rem;
          backdrop-filter: blur(20px);
          box-shadow: 0 0 80px rgba(124,58,237,0.1);
          transition: opacity 0.8s ease, transform 0.8s ease;
          margin-top: auto;
          margin-bottom: auto;
        }

        .club-form-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .club-form-logo-subtitle {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.4);
          font-weight: 400;
          text-align: center;
          letter-spacing: 0.02em;
        }

        .club-welcome-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .club-welcome-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
        }
        .club-welcome-text {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 600;
          white-space: nowrap;
        }

        .club-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .club-input-wrap { position: relative; margin-bottom: 1rem; }
        .club-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          border-radius: 0.75rem;
          padding: 0.8rem 1rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        
        /* Select dropdown styling */
        select.club-input {
          appearance: none;
          cursor: pointer;
        }
        select.club-input option {
          background: #12082A;
          color: #fff;
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

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 1rem;
        }
        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr; }
        }
        
        /* File upload specific */
        .club-file-upload {
          border: 1px dashed rgba(255,255,255,0.2);
          border-radius: 0.75rem;
          padding: 1rem;
          text-align: center;
          cursor: pointer;
          background: rgba(255,255,255,0.02);
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .club-file-upload:hover {
          border-color: rgba(124,58,237,0.6);
          background: rgba(124,58,237,0.05);
        }
        .club-file-input { display: none; }
        .club-file-text {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
        }
        .club-file-name {
          font-size: 0.85rem;
          color: #A855F7;
          font-weight: 500;
          word-break: break-all;
        }

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
          margin-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
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

        .club-form-card.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .club-form-card.hidden-start {
          opacity: 0;
          transform: translateY(20px);
        }
        
        .club-link-row {
          text-align: center;
          margin-top: 1.5rem;
        }
        .club-link {
          font-size: 0.9rem;
          color: #A855F7;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .club-link:hover { color: #C084FC; text-decoration: underline; }
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

          {/* Hero image overlay */}
          <div className="club-hero-img">
            <Image
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=1200"
              alt="Handball Training"
              fill
              className="object-cover"
              style={{ opacity: 0.25 }}
              priority
            />
          </div>
          <div className="club-hero-overlay" />

          <div className="club-left-content">
            <div>
              <div className="club-logo-badge">
                <div className="club-logo-dot" />
                <span className="club-logo-text">Inscription Club</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h1 className="club-headline">
                Rejoignez<br />
                notre <span className="club-headline-gradient">Équipe</span>
              </h1>
              <p className="club-desc">
                Creez votre fiche joueur officielle pour participer aux compétitions, suivre vos entrainements et faire partie de la grande famille du Handball.
              </p>

              <div className="club-features">
                <div className="club-feature-pill">
                  <Trophy size={14} /> Compétitions Officielles
                </div>
                <div className="club-feature-pill">
                  <Star size={14} /> Encadrement Pro
                </div>
                <div className="club-feature-pill">
                  <Users size={14} /> +500 Licenciés
                </div>
              </div>
            </div>

            <div />{/* spacing */}
          </div>
        </div>

        {/* ─── Right form panel ─── */}
        <div className="club-right">
          <div className={`club-form-card ${loaded ? 'visible' : 'hidden-start'}`}>
            <div className="club-form-logo">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white mb-2 shadow-lg">
                <UserPlus size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Fiche Joueur</h2>
              <p className="club-form-logo-subtitle">
                Remplissez vos informations pour la licence
              </p>
            </div>

            <div className="club-welcome-bar">
              <div className="club-welcome-line" />
              <span className="club-welcome-text">Informations Personnelles</span>
              <div className="club-welcome-line" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div>
                  <label className="club-label">Nom</label>
                  <div className="club-input-wrap">
                    <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} placeholder="Dupont" className="club-input"/>
                  </div>
                </div>
                <div>
                  <label className="club-label">Prénom</label>
                  <div className="club-input-wrap">
                    <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} placeholder="Jean" className="club-input"/>
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label className="club-label">Email</label>
                  <div className="club-input-wrap">
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="joueur@club.com" className="club-input"/>
                  </div>
                </div>
                <div>
                  <label className="club-label">Date de naissance</label>
                  <div className="club-input-wrap">
                    <input type="date" name="birthDate" required value={formData.birthDate} onChange={handleChange} className="club-input" style={{ colorScheme: 'dark' }}/>
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label className="club-label">N° Licence FTBHB</label>
                  <div className="club-input-wrap">
                    <input type="text" name="licenseNumber" required value={formData.licenseNumber} onChange={handleChange} placeholder="12345678" className="club-input"/>
                  </div>
                </div>
                <div>
                  <label className="club-label">Catégorie</label>
                  <div className="club-input-wrap">
                    <select name="category" required value={formData.category} onChange={handleChange} className="club-input">
                      <option value="" disabled>Sélectionnez...</option>
                      <option value="U10">U10</option>
                      <option value="U12">U12</option>
                      <option value="U14">U14</option>
                      <option value="U16">U16</option>
                      <option value="U18">U18</option>
                      <option value="Senior">Senior</option>
                      <option value="Veteran">Vétéran</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="club-label">Groupe sanguin</label>
                  <div className="club-input-wrap">
                    <select name="bloodGroup" required value={formData.bloodGroup} onChange={handleChange} className="club-input">
                      <option value="" disabled>Sélectionnez...</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label className="club-label">Taille (cm)</label>
                  <div className="club-input-wrap">
                    <input type="number" name="height" required value={formData.height} onChange={handleChange} placeholder="185" min="100" max="230" className="club-input"/>
                  </div>
                </div>
                <div>
                  <label className="club-label">Poids (kg)</label>
                  <div className="club-input-wrap">
                    <input type="number" name="weight" required value={formData.weight} onChange={handleChange} placeholder="80" min="30" max="150" step="0.1" className="club-input"/>
                  </div>
                </div>
              </div>

              <div className="club-welcome-bar" style={{ marginTop: '0.5rem' }}>
                <div className="club-welcome-line" />
                <span className="club-welcome-text">Documents Requis</span>
                <div className="club-welcome-line" />
              </div>

              <div className="form-grid">
                <div>
                  <label className="club-label">Certificat Médical</label>
                  <div className="club-input-wrap">
                    <label className="club-file-upload">
                      <Upload size={20} color="#A855F7" />
                      <span className="club-file-text">Cliquez pour ajouter (PDF/JPG)</span>
                      {medicalCert && <span className="club-file-name">{medicalCert.name}</span>}
                      <input type="file" name="medicalCert" className="club-file-input" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'medical')} required />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="club-label">Scan CIN / Passeport</label>
                  <div className="club-input-wrap">
                    <label className="club-file-upload">
                      <Upload size={20} color="#A855F7" />
                      <span className="club-file-text">Cliquez pour ajouter (PDF/JPG)</span>
                      {idScan && <span className="club-file-name">{idScan.name}</span>}
                      <input type="file" name="idScan" className="club-file-input" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'id')} required />
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className="club-btn">
                <UserPlus size={18} />
                Soumettre l&apos;inscription
              </button>

              <div className="club-link-row">
                <Link href="/" className="club-link">
                  Déjà inscrit ? Se connecter
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
