import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/layout/AdminLayout'
import { UserPlus, Clock, User, Plus, Eye, EyeOff, X, ChevronLeft, ChevronRight } from 'lucide-react'
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
  status: 'PENDING' | 'VALIDATED' | 'REJECTED'
  medicalCertUrl: string | null
  idScanUrl: string | null
}

export default function AdminPlayers() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Pagination states
  const [pendingPage, setPendingPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const itemsPerPage = 15 // Items per page for pending players (3 rows of 5 on xl screens)
  const historyItemsPerPage = 10 // Items per page for history
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    licenseNumber: '',
    category: 'U14',
    bloodGroup: 'A+',
    height: '',
    weight: '',
    username: '',
    password: '',
    medicalCertBase64: '',
    idScanBase64: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const { currentTheme } = useColors()

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/players/list')
      const data = await res.json()
      setPlayers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  // Filtered players (renamed to avoid conflicts)
  const filteredPendingPlayers = players.filter(p => p.status === 'PENDING')
  const filteredOtherPlayers = players.filter(p => p.status !== 'PENDING')
  
  // Calculate pagination for pending players
  const totalPendingPages = Math.ceil(filteredPendingPlayers.length / itemsPerPage)
  const pendingStartIndex = (pendingPage - 1) * itemsPerPage
  const pendingEndIndex = pendingStartIndex + itemsPerPage
  const currentPendingPlayers = filteredPendingPlayers.slice(pendingStartIndex, pendingEndIndex)
  
  // Calculate pagination for history
  const totalHistoryPages = Math.ceil(filteredOtherPlayers.length / historyItemsPerPage)
  const historyStartIndex = (historyPage - 1) * historyItemsPerPage
  const historyEndIndex = historyStartIndex + historyItemsPerPage
  const currentHistoryPlayers = filteredOtherPlayers.slice(historyStartIndex, historyEndIndex)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fieldName: 'medicalCertBase64' | 'idScanBase64') => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [fieldName]: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/players/create-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        alert('Joueur créé et compte utilisateur validé avec succès !')
        setShowAddModal(false)
        setShowPassword(false)
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          birthDate: '',
          licenseNumber: '',
          category: 'U14',
          bloodGroup: 'A+',
          height: '',
          weight: '',
          username: '',
          password: '',
          medicalCertBase64: '',
          idScanBase64: ''
        })
        fetchPlayers()
      } else {
        const { error } = await res.json()
        alert('Erreur: ' + error.message)
      }
    } catch {
      alert('Erreur lors de la création.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900" style={{ color: currentTheme.text }}>
              Gestion des Inscriptions
            </h1>
            <p className="mt-2 text-sm text-gray-700" style={{ color: `${currentTheme.text}99` }}>
              Consultez et validez les fiches des nouveaux joueurs.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 group relative overflow-hidden inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-md shadow-purple-200/50 hover:shadow-lg hover:shadow-purple-300/60 transition-all duration-300 transform hover:scale-105"
            title="Ajouter un joueur"
          >
            <span className="relative z-10">
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Pending Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-amber-500" size={20} />
            <h2 className="text-lg font-semibold" style={{ color: currentTheme.text }}>En attente de validation ({filteredPendingPlayers.length})</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredPendingPlayers.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
              <UserPlus className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-gray-500">Aucune demande d&apos;inscription en attente.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {currentPendingPlayers.map(player => (
                <div key={player.id} className="group bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden" 
                     style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                          <User size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm leading-tight truncate" style={{ color: currentTheme.text }}>
                            {player.firstName} {player.lastName}
                          </h3>
                          <p className="text-xs font-medium" style={{ color: `${currentTheme.text}70` }}>{player.category}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => router.push(`/admin/players/${player.id}`)}
                        className="group/btn relative overflow-hidden flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110"
                        title="Voir les détails"
                      >
                        <span className="relative z-10">
                          <Eye size={13} />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-800 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200"></div>
                      </button>
                    </div>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium" style={{ color: `${currentTheme.text}60` }}>Licence</span>
                        <span className="font-bold text-xs" style={{ color: currentTheme.text }}>{player.licenseNumber}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium" style={{ color: `${currentTheme.text}60` }}>Groupe</span>
                        <span className="font-bold text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-md">{player.bloodGroup}</span>
                      </div>
                    </div>
                  </div>
                </div>))}
            </div>
            
            {/* Pagination for pending players */}
            {totalPendingPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                <button
                  onClick={() => setPendingPage(prev => Math.max(prev - 1, 1))}
                  disabled={pendingPage === 1}
                  className="group flex items-center justify-center w-9 h-9 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:hover:shadow-sm"
                  style={{ borderColor: `${currentTheme.text}20` }}
                  title="Page précédente"
                >
                  <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPendingPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setPendingPage(page)}
                      className={`w-9 h-9 text-sm font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md ${
                        pendingPage === page
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-200/50'
                          : 'bg-white border hover:bg-gray-50 hover:scale-105'
                      }`}
                      style={{ 
                        borderColor: pendingPage !== page ? `${currentTheme.text}20` : undefined 
                      }}
                      title={`Page ${page}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setPendingPage(prev => Math.min(prev + 1, totalPendingPages))}
                  disabled={pendingPage === totalPendingPages}
                  className="group flex items-center justify-center w-9 h-9 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:hover:shadow-sm"
                  style={{ borderColor: `${currentTheme.text}20` }}
                  title="Page suivante"
                >
                  <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
              </div>
            )}
          </>
          )}
        </div>

        {/* Others Section */}
        {filteredOtherPlayers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: currentTheme.text }}>Historique (Validés/Refusés)</h2>
            <div className="bg-white rounded-xl overflow-hidden border shadow-sm" style={{ backgroundColor: currentTheme.surface, borderColor: `${currentTheme.text}20` }}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" style={{ borderTop: `1px solid ${currentTheme.text}20` }}>
                  <thead className="bg-gray-50" style={{ backgroundColor: `${currentTheme.text}05` }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joueur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200" style={{ borderTop: `1px solid ${currentTheme.text}20` }}>
                    {currentHistoryPlayers.map(player => (
                      <tr key={player.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: currentTheme.text }}>
                          {player.firstName} {player.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {player.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${player.status === 'VALIDATED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {player.status === 'VALIDATED' ? 'Accepté' : 'Refusé'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(player.birthDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => router.push(`/admin/players/${player.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                          >
                            <Eye size={14} />
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Pagination for history */}
            {totalHistoryPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                <button
                  onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                  disabled={historyPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  style={{ borderColor: `${currentTheme.text}20` }}
                >
                  <ChevronLeft size={16} />
                  Précédent
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setHistoryPage(page)}
                      className={`w-10 h-10 text-sm font-medium rounded-lg transition ${
                        historyPage === page
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border hover:bg-gray-50'
                      }`}
                      style={{ 
                        borderColor: historyPage !== page ? `${currentTheme.text}20` : undefined 
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setHistoryPage(prev => Math.min(prev + 1, totalHistoryPages))}
                  disabled={historyPage === totalHistoryPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  style={{ borderColor: `${currentTheme.text}20` }}
                >
                  Suivant
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Player Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: currentTheme.background }}>
            <div className="p-6 border-b" style={{ borderColor: `${currentTheme.text}20` }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: currentTheme.text }}>Ajouter un nouveau joueur</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>Prénom *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="Prénom du joueur"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                    style={{ borderColor: `${currentTheme.text}30`, backgroundColor: `${currentTheme.text}05` }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>Nom *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Nom du joueur"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                    style={{ borderColor: `${currentTheme.text}30`, backgroundColor: `${currentTheme.text}05` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                    style={{ borderColor: `${currentTheme.text}30`, backgroundColor: `${currentTheme.text}05` }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>Date de naissance *</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    style={{ borderColor: `${currentTheme.text}30`, backgroundColor: `${currentTheme.text}05` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>Numéro de licence FTBHB *</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Numéro de licence FTBHB"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                    style={{ borderColor: `${currentTheme.text}30`, backgroundColor: currentTheme.surface, color: currentTheme.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>Catégorie *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    style={{ borderColor: `${currentTheme.text}30`, backgroundColor: `${currentTheme.text}05` }}
                  >
                    <option value="" disabled>Sélectionner une catégorie</option>
                    <option value="U14">U14</option>
                    <option value="U16">U16</option>
                    <option value="U18">U18</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>Groupe sanguin *</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                    style={{ borderColor: `${currentTheme.text}30`, backgroundColor: `${currentTheme.text}05` }}
                  >
                    <option value="" disabled>Sélectionner un groupe sanguin</option>
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
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>Taille (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    placeholder="Taille en cm"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                    style={{ borderColor: `${currentTheme.text}30`, backgroundColor: currentTheme.surface, color: currentTheme.text }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>Poids (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="Poids en kg"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                    style={{ borderColor: `${currentTheme.text}30`, backgroundColor: currentTheme.surface, color: currentTheme.text }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Laisser vide pour utiliser le numéro de licence"
                    className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500 placeholder-opacity-100"
                    style={{ borderColor: `${currentTheme.text}30`, backgroundColor: `${currentTheme.text}05` }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>Certificat médical</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'medicalCertBase64')}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-700 file:text-gray-700"
                    style={{ borderColor: `${currentTheme.text}30`, backgroundColor: `${currentTheme.text}05` }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.text }}>Scan CIN/Passeport</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'idScanBase64')}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-700 file:text-gray-700"
                    style={{ borderColor: `${currentTheme.text}30`, backgroundColor: `${currentTheme.text}05` }}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  style={{ borderColor: `${currentTheme.text}30`, color: currentTheme.text }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
                >
                  {submitting ? 'Création...' : 'Créer le joueur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
