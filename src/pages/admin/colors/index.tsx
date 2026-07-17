import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import AdminLayout from '../../../components/layout/AdminLayout'
import { usePermissions } from '../../../hooks/usePermissions'
import { useColors, ColorTheme, defaultThemes } from '../../../contexts/ColorContext'
import { ToastProvider } from '../../../components/ui/toast-compat'
import { Button } from '../../../components/ui/button'
import ThemeCreatorModal from '../../../components/colors/ThemeCreatorModal'
import LiveWebsitePreview from '../../../components/colors/LiveWebsitePreview'
import CustomIcon from '../../../components/ui/CustomIcon'
import {
  Plus,
  Palette,
  Sparkles,
  Eye,
  Edit,
  Trash2,
  Wand2,
  Heart,
  Star,
  Zap
} from 'lucide-react'

export default function ColorsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { canAccessUsers } = usePermissions() // Using users permission for now
  const { currentTheme, themes, setTheme, addCustomTheme, updateTheme, deleteTheme } = useColors()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTheme, setEditingTheme] = useState<ColorTheme | null>(null)
  const [previewTheme, setPreviewTheme] = useState<ColorTheme | null>(null)

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  if (!canAccessUsers()) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
        <p className="text-gray-600">Vous n&apos;avez pas les permissions nécessaires.</p>
      </div>
    </div>
  }

  const handlePreview = (theme: ColorTheme) => {
    setPreviewTheme(theme)
    // Preview only affects the LiveWebsitePreview component, not the entire app
  }

  const handleStopPreview = () => {
    setPreviewTheme(null)
    // No need to restore CSS variables since preview only affects web preview
  }

  const handleApplyTheme = (theme: ColorTheme) => {
    setTheme(theme.id)
    handleStopPreview()
  }

  const handleSaveTheme = (theme: ColorTheme) => {
    if (editingTheme) {
      updateTheme(theme)
    } else {
      addCustomTheme(theme)
    }
    setEditingTheme(null)
  }

  const getThemeIcon = (theme: ColorTheme) => {
    if (theme.id === 'amadeus') {
      return <CustomIcon name="Sparkles" className="w-5 h-5" iconType="custom" />
    }

    switch (theme.id) {
      case 'teal': return <Sparkles className="w-5 h-5" />
      case 'purple': return <Star className="w-5 h-5" />
      case 'emerald': return <Heart className="w-5 h-5" />
      case 'orange': return <Zap className="w-5 h-5" />
      case 'rose': return <Heart className="w-5 h-5" />
      case 'blue': return <Sparkles className="w-5 h-5" />
      default: return <Palette className="w-5 h-5" />
    }
  }

  return (
    <ToastProvider>
      <AdminLayout>
        <div className={`min-h-screen bg-gradient-to-br ${currentTheme.background}`}>
          <div className="py-8 px-6">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
                      <Palette className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Thèmes & Couleurs
                      </h1>
                      <p className="text-gray-600 text-lg">Personnalisez l&apos;apparence de votre application</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un thème
                  </Button>
                </div>
              </div>
            </div>

            {/* Current Theme Preview */}
            <div className="mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Thème Actuel</h3>
                  {previewTheme && (
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-sm text-orange-600 font-medium">Aperçu: {previewTheme.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStopPreview}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApplyTheme(previewTheme)}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                      >
                        Appliquer
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{currentTheme.name}</h4>
                      <p className="text-sm text-gray-600">Thème actuellement appliqué à l&apos;application</p>
                    </div>

                    <div className="space-y-3">
                      {/* Main Colors */}
                      <div>
                        <div className="text-xs text-gray-500 mb-2 font-medium">Couleurs principales</div>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: currentTheme.primary }}
                            ></div>
                            <span className="text-xs text-gray-600">Primaire</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: currentTheme.secondary }}
                            ></div>
                            <span className="text-xs text-gray-600">Secondaire</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: currentTheme.accent }}
                            ></div>
                            <span className="text-xs text-gray-600">Accent</span>
                          </div>
                        </div>
                      </div>

                      {/* Sidebar Colors */}
                      <div>
                        <div className="text-xs text-gray-500 mb-2 font-medium">Barre latérale</div>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded border-2 border-white shadow-md"
                              style={{ backgroundColor: currentTheme.sidebarBackgroundSolid || currentTheme.sidebarBorder }}
                            ></div>
                            <span className="text-xs text-gray-600">Arrière-plan</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded border-2 border-white shadow-md"
                              style={{ backgroundColor: currentTheme.sidebarTextHover }}
                            ></div>
                            <span className="text-xs text-gray-600">Hover</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded border-2 border-white shadow-md"
                              style={{ backgroundColor: currentTheme.sidebarActiveBackgroundSolid || currentTheme.sidebarTextHover }}
                            ></div>
                            <span className="text-xs text-gray-600">Actif</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Aperçu des composants</h5>
                    <div className="space-y-4">
                      {/* Buttons */}
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          style={{ backgroundColor: currentTheme.primary }}
                          className="text-white"
                        >
                          Bouton Principal
                        </Button>
                        <div className="flex items-center gap-2">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${currentTheme.primary}20` }}
                          >
                            {getThemeIcon(currentTheme)}
                          </div>
                          <span className="text-sm text-gray-700">Icône avec fond</span>
                        </div>
                      </div>

                      {/* Mini Sidebar Preview */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Sidebar</div>
                        <div
                          className="rounded-lg p-2 border"
                          style={{
                            background: currentTheme.sidebarBackground,
                            borderColor: currentTheme.sidebarBorder
                          }}
                        >
                          <div className="space-y-1">
                            {['Dashboard'].map((item, index) => (
                              <div
                                key={item}
                                className="flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors"
                                style={{
                                  background: index === 1 ? currentTheme.sidebarActiveBackground : 'transparent',
                                  color: index === 1 ? currentTheme.sidebarActiveText : currentTheme.sidebarText,
                                  boxShadow: index === 1 ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
                                }}
                              >
                                <div className="w-2 h-2 rounded" style={{ backgroundColor: 'currentColor', opacity: 0.7 }}></div>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Website Preview */}
            <div className="mb-8">
              <LiveWebsitePreview theme={previewTheme || currentTheme} isAnimated={true} />
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-200 hover:shadow-lg ${currentTheme.id === theme.id
                    ? 'border-purple-300 ring-2 ring-purple-500/20'
                    : 'border-white/20 hover:border-purple-200'
                    }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-xl shadow-md"
                        style={{ backgroundColor: `${theme.primary}20` }}
                      >
                        {getThemeIcon(theme)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{theme.name}</h4>
                        {currentTheme.id === theme.id && (
                          <span className="text-xs text-purple-600 font-medium">Actuel</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!defaultThemes.find(t => t.id === theme.id) && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingTheme(theme)
                              setShowCreateModal(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTheme(theme.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {/* Main Colors */}
                    <div>
                      <div className="text-xs text-gray-600 mb-1 font-medium">Couleurs principales</div>
                      <div className="flex gap-2">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                          style={{ backgroundColor: theme.primary }}
                          title="Primaire"
                        ></div>
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                          style={{ backgroundColor: theme.secondary }}
                          title="Secondaire"
                        ></div>
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                          style={{ backgroundColor: theme.accent }}
                          title="Accent"
                        ></div>
                      </div>
                    </div>

                    {/* Sidebar Colors */}
                    <div>
                      <div className="text-xs text-gray-600 mb-1 font-medium">Barre latérale</div>
                      <div className="flex gap-2">
                        <div
                          className="w-6 h-6 rounded border-2 border-white shadow-md"
                          style={{ backgroundColor: theme.sidebarBackgroundSolid || theme.sidebarBorder }}
                          title="Arrière-plan sidebar"
                        ></div>
                        <div
                          className="w-6 h-6 rounded border-2 border-white shadow-md"
                          style={{ backgroundColor: theme.sidebarTextHover }}
                          title="Hover sidebar"
                        ></div>
                        <div
                          className="w-6 h-6 rounded border-2 border-white shadow-md"
                          style={{ backgroundColor: theme.sidebarActiveBackgroundSolid || theme.sidebarTextHover }}
                          title="Actif sidebar"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(theme)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Aperçu
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApplyTheme(theme)}
                      style={{ backgroundColor: theme.primary }}
                      className="text-white flex-1"
                    >
                      <Wand2 className="w-4 h-4 mr-1" />
                      Appliquer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Theme Creator Modal */}
        <ThemeCreatorModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTheme(null)
          }}
          onSave={handleSaveTheme}
          editingTheme={editingTheme}
        />
      </AdminLayout>
    </ToastProvider>
  )
}
