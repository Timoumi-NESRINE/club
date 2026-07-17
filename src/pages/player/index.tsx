import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import PlayerLayout from '@/components/layout/PlayerLayout'
import { Mail, Calendar, CreditCard, Activity, Trophy, Target, Clock, FileText } from 'lucide-react'
import { useColors } from '@/contexts/ColorContext'

interface PlayerInfo {
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
  createdAt: string
}

export default function PlayerDashboard() {
  const { data: session } = useSession()
  const { currentTheme } = useColors()
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      fetchPlayerInfo()
    }
  }, [session])

  const fetchPlayerInfo = async () => {
    try {
      const res = await fetch('/api/player/profile')
      if (res.ok) {
        const data = await res.json()
        setPlayerInfo(data)
      }
    } catch (error) {
      console.error('Error fetching player info:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALIDATED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <Activity size={14} /> Compte Validé
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <Clock size={14} /> En attente de validation
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
            <Clock size={14} /> En attente de validation
          </span>
        )
    }
  }

  if (loading) {
    return (
      <PlayerLayout>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      </PlayerLayout>
    )
  }

  return (
    <PlayerLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: currentTheme.text }}>
            Bienvenue, {playerInfo?.firstName || session?.user?.firstName}! 👋
          </h1>
          <p style={{ color: currentTheme.textSecondary }}>
            Voici votre espace personnel pour gérer vos informations et suivre votre activité.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl p-6 mb-6 border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: currentTheme.text }}>
              Statut du compte
            </h2>
            {playerInfo && getStatusBadge(playerInfo.status)}
          </div>
          <p style={{ color: currentTheme.textSecondary }}>
            {playerInfo?.status === 'VALIDATED' 
              ? 'Votre compte est validé et vous pouvez accéder à toutes les fonctionnalités.'
              : 'Votre compte est en attente de validation par l\'administrateur.'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CreditCard size={24} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: currentTheme.textSecondary }}>Licence</p>
                <p className="text-lg font-bold" style={{ color: currentTheme.text }}>
                  {playerInfo?.licenseNumber || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target size={24} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: currentTheme.textSecondary }}>Catégorie</p>
                <p className="text-lg font-bold" style={{ color: currentTheme.text }}>
                  {playerInfo?.category || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar size={24} className="text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: currentTheme.textSecondary }}>Âge</p>
                <p className="text-lg font-bold" style={{ color: currentTheme.text }}>
                  {playerInfo?.birthDate 
                    ? `${new Date().getFullYear() - new Date(playerInfo.birthDate).getFullYear()} ans`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <Activity size={24} className="text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: currentTheme.textSecondary }}>Groupe Sanguin</p>
                <p className="text-lg font-bold text-red-600">
                  {playerInfo?.bloodGroup || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl p-6 mb-6 border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: currentTheme.text }}>
            Informations personnelles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Nom complet</label>
              <p className="font-medium" style={{ color: currentTheme.text }}>
                {playerInfo?.firstName} {playerInfo?.lastName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Email</label>
              <p className="font-medium flex items-center gap-2" style={{ color: currentTheme.text }}>
                <Mail size={16} />
                {playerInfo?.email || session?.user?.email}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Date de naissance</label>
              <p className="font-medium" style={{ color: currentTheme.text }}>
                {playerInfo?.birthDate 
                  ? new Date(playerInfo.birthDate).toLocaleDateString('fr-FR')
                  : 'Non spécifié'
                }
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.textSecondary }}>Taille / Poids</label>
              <p className="font-medium" style={{ color: currentTheme.text }}>
                {playerInfo?.height && playerInfo?.weight 
                  ? `${playerInfo.height} cm / ${playerInfo.weight} kg`
                  : 'Non spécifié'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: currentTheme.text }}>
            Actions rapides
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-left" style={{ borderColor: `${currentTheme.text}20` }}>
              <FileText size={20} className="mb-2" style={{ color: currentTheme.primary }} />
              <h3 className="font-medium" style={{ color: currentTheme.text }}>Mes documents</h3>
              <p className="text-sm" style={{ color: currentTheme.textSecondary }}>Voir certificat et CIN</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-left" style={{ borderColor: `${currentTheme.text}20` }}>
              <Calendar size={20} className="mb-2" style={{ color: currentTheme.primary }} />
              <h3 className="font-medium" style={{ color: currentTheme.text }}>Calendrier</h3>
              <p className="text-sm" style={{ color: currentTheme.textSecondary }}>Voir les entraînements</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-left" style={{ borderColor: `${currentTheme.text}20` }}>
              <Trophy size={20} className="mb-2" style={{ color: currentTheme.primary }} />
              <h3 className="font-medium" style={{ color: currentTheme.text }}>Compétitions</h3>
              <p className="text-sm" style={{ color: currentTheme.textSecondary }}>Résultats et classements</p>
            </button>
          </div>
        </div>
      </div>
    </PlayerLayout>
  )
}
