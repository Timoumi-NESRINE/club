import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/layout/AdminLayout'
import { ArrowLeft, User, Mail, Calendar, CreditCard, FileText, Download, Activity, CheckCircle, XCircle, Clock, Check, X } from 'lucide-react'
import { useColors } from '@/contexts/ColorContext'

interface Player {
  id: string
  firstName: string
  lastName: string
  email: string
  birthDate: string
  licenseNumber: string
  category: string
  bloodGroup: string
  height?: number
  weight?: number
  status: 'PENDING' | 'VALIDATED' | 'REJECTED'
  medicalCertUrl: string | null
  idScanUrl: string | null
  createdAt: string
  updatedAt: string
}

export default function PlayerDetail() {
  const router = useRouter()
  const { id } = router.query
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const { currentTheme } = useColors()
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'ACCEPT' | 'REJECT' | null>(null)
  const [processing, setProcessing] = useState(false)

  // Wrap fetchPlayer in useCallback to avoid dependency warning
  const fetchPlayer = useCallback(async () => {
    try {
      const res = await fetch(`/api/players/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPlayer(data)
      } else {
        console.error('Player not found')
        router.push('/admin/players')
      }
    } catch (err) {
      console.error('Error fetching player:', err)
      router.push('/admin/players')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    if (id) {
      fetchPlayer()
    }
  }, [id, fetchPlayer])

  const openConfirmModal = (action: 'ACCEPT' | 'REJECT') => {
    setPendingAction(action)
    setShowConfirmModal(true)
  }

  const closeConfirmModal = () => {
    setShowConfirmModal(false)
    setPendingAction(null)
    setProcessing(false)
  }

  const executeAction = async () => {
    if (!pendingAction || !player) return
    
    setProcessing(true)
    
    try {
      const res = await fetch('/api/players/handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: player.id, action: pendingAction })
      })
      if (res.ok) {
        closeConfirmModal()
        // Show success notification
        const notification = document.createElement('div')
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          pendingAction === 'ACCEPT' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`
        notification.innerHTML = `
          <div class="flex items-center gap-2">
            ${pendingAction === 'ACCEPT' ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'}
            <span class="font-semibold">${pendingAction === 'ACCEPT' ? 'Joueur accepté avec succès !' : 'Joueur refusé.'}</span>
          </div>
        `
        document.body.appendChild(notification)
        setTimeout(() => {
          notification.style.opacity = '0'
          notification.style.transform = 'translateY(-10px)'
          setTimeout(() => notification.remove(), 300)
        }, 3000)
        
        fetchPlayer() // Refresh player data
      } else {
        const error = await res.json()
        alert('Erreur: ' + error.message)
        setProcessing(false)
      }
    } catch {
      alert('Erreur lors du traitement.')
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALIDATED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle size={14} /> Validé
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <XCircle size={14} /> Refusé
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
            <Clock size={14} /> En attente
          </span>
        )
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!player) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-500">Joueur non trouvé</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/players')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
            style={{ color: currentTheme.textSecondary }}
          >
            <ArrowLeft size={20} />
            Retour à la liste
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <User size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
                  {player.firstName} {player.lastName}
                </h1>
                <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                  {player.category} • Licence: {player.licenseNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(player.status)}
              {player.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openConfirmModal('ACCEPT')}
                    className="group relative overflow-hidden flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center gap-1">
                      <Check size={14} />
                      Accepter
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </button>
                  <button
                    onClick={() => openConfirmModal('REJECT')}
                    className="group relative overflow-hidden flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    <span className="relative z-10 flex items-center gap-1">
                      <X size={14} />
                      Refuser
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: currentTheme.text }}>
                <User size={20} />
                Informations personnelles
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Nom complet</label>
                  <p className="font-medium" style={{ color: currentTheme.text }}>
                    {player.firstName} {player.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Email</label>
                  <p className="font-medium flex items-center gap-2" style={{ color: currentTheme.text }}>
                    <Mail size={16} />
                    {player.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Date de naissance</label>
                  <p className="font-medium flex items-center gap-2" style={{ color: currentTheme.text }}>
                    <Calendar size={16} />
                    {new Date(player.birthDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Groupe sanguin</label>
                  <p className="font-medium text-red-600 font-bold">
                    {player.bloodGroup}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Taille</label>
                  <p className="font-medium" style={{ color: currentTheme.text }}>
                    {player.height ? `${player.height} cm` : 'Non spécifié'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Poids</label>
                  <p className="font-medium" style={{ color: currentTheme.text }}>
                    {player.weight ? `${player.weight} kg` : 'Non spécifié'}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: currentTheme.text }}>
                <FileText size={20} />
                Documents
              </h2>
              
              <div className="space-y-3">
                {player.medicalCertUrl ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg" style={{ borderColor: `${currentTheme.text}20` }}>
                    <div className="flex items-center gap-3">
                      <FileText size={20} style={{ color: currentTheme.primary }} />
                      <div>
                        <p className="font-medium" style={{ color: currentTheme.text }}>Certificat médical</p>
                        <p className="text-sm" style={{ color: currentTheme.textSecondary }}>Document valide</p>
                      </div>
                    </div>
                    <a
                      href={player.medicalCertUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                    >
                      <Download size={16} />
                      Voir
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-lg opacity-50" style={{ borderColor: `${currentTheme.text}20` }}>
                    <div className="flex items-center gap-3">
                      <FileText size={20} style={{ color: currentTheme.textSecondary }} />
                      <div>
                        <p className="font-medium" style={{ color: currentTheme.text }}>Certificat médical</p>
                        <p className="text-sm" style={{ color: currentTheme.textSecondary }}>Non fourni</p>
                      </div>
                    </div>
                  </div>
                )}

                {player.idScanUrl ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg" style={{ borderColor: `${currentTheme.text}20` }}>
                    <div className="flex items-center gap-3">
                      <CreditCard size={20} style={{ color: currentTheme.primary }} />
                      <div>
                        <p className="font-medium" style={{ color: currentTheme.text }}>Scan CIN/Passeport</p>
                        <p className="text-sm" style={{ color: currentTheme.textSecondary }}>Document valide</p>
                      </div>
                    </div>
                    <a
                      href={player.idScanUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                    >
                      <Download size={16} />
                      Voir
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-lg opacity-50" style={{ borderColor: `${currentTheme.text}20` }}>
                    <div className="flex items-center gap-3">
                      <CreditCard size={20} style={{ color: currentTheme.textSecondary }} />
                      <div>
                        <p className="font-medium" style={{ color: currentTheme.text }}>Scan CIN/Passeport</p>
                        <p className="text-sm" style={{ color: currentTheme.textSecondary }}>Non fourni</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* License Info */}
            <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: currentTheme.text }}>
                <CreditCard size={20} />
                Licence
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Numéro de licence</label>
                  <p className="font-mono font-bold text-lg" style={{ color: currentTheme.primary }}>
                    {player.licenseNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Catégorie</label>
                  <p className="font-medium" style={{ color: currentTheme.text }}>
                    {player.category}
                  </p>
                </div>
              </div>
            </div>

            {/* Status & Timeline */}
            <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: currentTheme.text }}>
                <Activity size={20} />
                Statut & Historique
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Statut actuel</label>
                  <div>{getStatusBadge(player.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Date d&apos;inscription</label>
                  <p className="font-medium" style={{ color: currentTheme.text }}>
                    {new Date(player.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Dernière mise à jour</label>
                  <p className="font-medium" style={{ color: currentTheme.text }}>
                    {new Date(player.updatedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && pendingAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{ backgroundColor: currentTheme.surface }}>
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    pendingAction === 'ACCEPT' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {pendingAction === 'ACCEPT' ? <Check size={32} /> : <X size={32} />}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-center mb-2" style={{ color: currentTheme.text }}>
                  {pendingAction === 'ACCEPT' ? 'Confirmer l&apos;acceptation' : 'Confirmer le refus'}
                </h3>
                
                <p className="text-center mb-6" style={{ color: currentTheme.textSecondary }}>
                  Êtes-vous sûr de vouloir {pendingAction === 'ACCEPT' ? 'accepter' : 'refuser'} ce joueur ?
                  <br />
                  <span className="font-semibold" style={{ color: currentTheme.text }}>
                    {player?.firstName} {player?.lastName}
                  </span>
                </p>
                
                {pendingAction === 'ACCEPT' && (
                  <p className="text-sm text-center mb-6 p-3 bg-green-50 rounded-lg text-green-700">
                    Un compte utilisateur sera automatiquement créé pour ce joueur.
                  </p>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={closeConfirmModal}
                    disabled={processing}
                    className="flex-1 px-4 py-3 border rounded-xl font-medium transition-all duration-200 hover:bg-gray-50 disabled:opacity-50"
                    style={{ borderColor: `${currentTheme.text}30`, color: currentTheme.text }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={executeAction}
                    disabled={processing}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      pendingAction === 'ACCEPT'
                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-200'
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-200'
                    }`}
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Traitement...
                      </span>
                    ) : (
                      pendingAction === 'ACCEPT' ? 'Accepter' : 'Refuser'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
