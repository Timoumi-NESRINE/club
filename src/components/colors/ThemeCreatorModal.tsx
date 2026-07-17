import { useState, useEffect, useCallback } from 'react'
import { Modal, ModalFooter } from '../ui/modal'
import { Button } from '../ui/button'
import { ColorTheme } from '../../contexts/ColorContext'
import {
  Palette,
  Sparkles,
  Eye,
  Save,
  X,
  RefreshCw,
  Wand2
} from 'lucide-react'

interface ThemeCreatorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (theme: ColorTheme) => void
  editingTheme?: ColorTheme | null
}

const gradientOptions = [
  'from-teal-50 via-cyan-50 to-blue-50',
  'from-purple-50 via-violet-50 to-indigo-50',
  'from-emerald-50 via-green-50 to-teal-50',
  'from-orange-50 via-amber-50 to-yellow-50',
  'from-rose-50 via-pink-50 to-red-50',
  'from-blue-50 via-indigo-50 to-purple-50',
  'from-gray-50 via-slate-50 to-zinc-50',
  'from-pink-50 via-rose-50 to-red-50'
]

export default function ThemeCreatorModal({ isOpen, onClose, onSave, editingTheme }: ThemeCreatorModalProps) {
  const [formData, setFormData] = useState<Omit<ColorTheme, 'id'>>({
    name: '',
    primary: '#149fad',
    secondary: '#0891b2',
    accent: '#06b6d4',
    background: 'from-teal-50 via-cyan-50 to-blue-50',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    sidebarBackground: '#ffffff',
    sidebarText: '#6b7280',
    sidebarTextHover: '#149fad',
    sidebarActiveBackground: '#149fad',
    sidebarActiveText: '#ffffff',
    sidebarBorder: '#e5e7eb',
    sidebarBackgroundSolid: '#ffffff',
    sidebarActiveBackgroundSolid: '#149fad'
  })

  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    if (editingTheme) {
      setFormData({
        name: editingTheme.name,
        primary: editingTheme.primary,
        secondary: editingTheme.secondary,
        accent: editingTheme.accent,
        background: editingTheme.background,
        surface: editingTheme.surface,
        text: editingTheme.text,
        textSecondary: editingTheme.textSecondary,
        success: editingTheme.success,
        warning: editingTheme.warning,
        error: editingTheme.error,
        info: editingTheme.info,
        sidebarBackground: editingTheme.sidebarBackground,
        sidebarText: editingTheme.sidebarText,
        sidebarTextHover: editingTheme.sidebarTextHover,
        sidebarActiveBackground: editingTheme.sidebarActiveBackground,
        sidebarActiveText: editingTheme.sidebarActiveText,
        sidebarBorder: editingTheme.sidebarBorder,
        sidebarBackgroundSolid: editingTheme.sidebarBackgroundSolid || '#ffffff',
        sidebarActiveBackgroundSolid: editingTheme.sidebarActiveBackgroundSolid || editingTheme.primary
      })
    } else {
      setFormData({
        name: '',
        primary: '#149fad',
        secondary: '#0891b2',
        accent: '#06b6d4',
        background: 'from-teal-50 via-cyan-50 to-blue-50',
        surface: '#ffffff',
        text: '#1f2937',
        textSecondary: '#6b7280',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        sidebarBackground: '#ffffff',
        sidebarText: '#6b7280',
        sidebarTextHover: '#149fad',
        sidebarActiveBackground: '#149fad',
        sidebarActiveText: '#ffffff',
        sidebarBorder: '#e5e7eb',
        sidebarBackgroundSolid: '#ffffff',
        sidebarActiveBackgroundSolid: '#149fad'
      })
    }
  }, [editingTheme, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newTheme: ColorTheme = {
      ...formData,
      id: editingTheme?.id || `custom-${Date.now()}`
    }

    onSave(newTheme)
    onClose()
  }

  const handleColorChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateRandomTheme = () => {
    const hue = Math.floor(Math.random() * 360)
    const primary = `hsl(${hue}, 70%, 50%)`
    const secondary = `hsl(${(hue + 30) % 360}, 70%, 55%)`
    const accent = `hsl(${(hue + 60) % 360}, 70%, 60%)`
    const randomGradient = gradientOptions[Math.floor(Math.random() * gradientOptions.length)]

    setFormData(prev => ({
      ...prev,
      name: prev.name || `Thème ${Math.floor(Math.random() * 1000)}`,
      primary,
      secondary,
      accent,
      background: randomGradient,
      sidebarTextHover: primary,
      sidebarActiveBackground: primary
    }))
  }

  const applyPreview = useCallback(() => {
    if (!previewMode) return

    const root = document.documentElement
    root.style.setProperty('--color-primary', formData.primary)
    root.style.setProperty('--color-secondary', formData.secondary)
    root.style.setProperty('--color-accent', formData.accent)
    root.style.setProperty('--sidebar-background', formData.sidebarBackground)
    root.style.setProperty('--sidebar-text', formData.sidebarText)
    root.style.setProperty('--sidebar-text-hover', formData.sidebarTextHover)
    root.style.setProperty('--sidebar-active-background', formData.sidebarActiveBackground)
    root.style.setProperty('--sidebar-active-text', formData.sidebarActiveText)
    root.style.setProperty('--sidebar-border', formData.sidebarBorder)
  }, [previewMode, formData])

  useEffect(() => {
    if (previewMode) {
      applyPreview()
    }
  }, [formData, previewMode, applyPreview])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTheme ? 'Modifier le thème' : 'Créer un nouveau thème'}
      size="xl"
    >
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 -m-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {editingTheme ? 'Modifier le thème' : 'Créateur de thème'}
            </h3>
            <p className="text-sm text-gray-600">
              Personnalisez les couleurs de votre application
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Theme Name */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Informations du thème</h4>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={generateRandomTheme}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Aléatoire
              </Button>
              <Button
                type="button"
                size="sm"
                variant={previewMode ? 'default' : 'outline'}
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="w-4 h-4 mr-1" />
                {previewMode ? 'Arrêter l\'aperçu' : 'Aperçu live'}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du thème *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleColorChange('name', e.target.value)}
              required
              placeholder="Ex: Mon thème personnalisé"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-gray-900 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Primary Colors */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Palette className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Couleurs principales</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur primaire
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur secondaire
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur d&apos;accent
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Background Gradient */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Wand2 className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Arrière-plan dégradé</h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gradientOptions.map((gradient) => (
              <button
                key={gradient}
                type="button"
                onClick={() => handleColorChange('background', gradient)}
                className={`h-16 rounded-xl border-2 transition-all duration-200 bg-gradient-to-br ${gradient} ${formData.background === gradient
                    ? 'border-purple-500 ring-2 ring-purple-500/20'
                    : 'border-gray-200 hover:border-purple-300'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Sidebar Colors */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900">Couleurs de la barre latérale</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arrière-plan
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.sidebarBackground}
                  onChange={(e) => handleColorChange('sidebarBackground', e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.sidebarBackground}
                  onChange={(e) => handleColorChange('sidebarBackground', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texte
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.sidebarText}
                  onChange={(e) => handleColorChange('sidebarText', e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.sidebarText}
                  onChange={(e) => handleColorChange('sidebarText', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texte au survol
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.sidebarTextHover}
                  onChange={(e) => handleColorChange('sidebarTextHover', e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.sidebarTextHover}
                  onChange={(e) => handleColorChange('sidebarTextHover', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Élément actif
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.sidebarActiveBackground}
                  onChange={(e) => handleColorChange('sidebarActiveBackground', e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.sidebarActiveBackground}
                  onChange={(e) => handleColorChange('sidebarActiveBackground', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Aperçu du thème</h4>
          </div>

          <div className={`bg-gradient-to-br ${formData.background} rounded-xl p-6`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Content Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-xl shadow-lg"
                    style={{ backgroundColor: formData.primary }}
                  >
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900">{formData.name || 'Nom du thème'}</h5>
                    <p className="text-sm text-gray-600">Aperçu du thème personnalisé</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg text-white font-medium shadow-lg text-sm"
                    style={{ backgroundColor: formData.primary }}
                  >
                    Principal
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg text-white font-medium shadow-lg text-sm"
                    style={{ backgroundColor: formData.secondary }}
                  >
                    Secondaire
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg text-white font-medium shadow-lg text-sm"
                    style={{ backgroundColor: formData.accent }}
                  >
                    Accent
                  </button>
                </div>
              </div>

              {/* Sidebar Preview */}
              <div className="space-y-2">
                <h6 className="text-sm font-medium text-gray-700 mb-3">Aperçu de la barre latérale</h6>
                <div
                  className="rounded-lg p-3 border shadow-sm"
                  style={{
                    background: formData.sidebarBackground,
                    borderColor: formData.sidebarBorder
                  }}
                >
                  <div className="space-y-1">
                    {['Dashboard'].map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors"
                        style={{
                          background: index === 1 ? formData.sidebarActiveBackground : 'transparent',
                          color: index === 1 ? formData.sidebarActiveText : formData.sidebarText,
                          boxShadow: index === 1 ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'
                        }}
                      >
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: 'currentColor', opacity: 0.7 }}></div>
                        <span className="text-xs">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {editingTheme ? 'Modifier' : 'Créer le thème'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
