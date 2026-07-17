import { useState, useEffect } from 'react'
import { ColorTheme } from '../../contexts/ColorContext'
import {
  Monitor,
  Smartphone,
  Tablet,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface WebsitePreviewProps {
  theme: ColorTheme
  isAnimated?: boolean
}

export default function WebsitePreview({ theme, isAnimated = false }: WebsitePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isPlaying, setIsPlaying] = useState(isAnimated)
  const [currentPage, setCurrentPage] = useState(0)

  const pages = [
    'Dashboard'
  ]

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % pages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [isPlaying, pages.length])

  const getDeviceClasses = () => {
    switch (viewMode) {
      case 'mobile':
        return 'w-80 h-96'
      case 'tablet':
        return 'w-96 h-80'
      default:
        return 'w-full h-96'
    }
  }

  const getDeviceIcon = () => {
    switch (viewMode) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />
      case 'tablet':
        return <Tablet className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Monitor className="w-4 h-4 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900">Aperçu du site web</h4>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
              <button
                key={device}
                onClick={() => setViewMode(device)}
                className={`p-2 rounded-md transition-all duration-200 ${viewMode === device
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {device === 'desktop' && <Monitor className="w-4 h-4" />}
                {device === 'tablet' && <Tablet className="w-4 h-4" />}
                {device === 'mobile' && <Smartphone className="w-4 h-4" />}
              </button>
            ))}
          </div>

          {/* Animation Controls */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setCurrentPage(0)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Device Frame */}
      <div className="flex justify-center">
        <div className={`${getDeviceClasses()} transition-all duration-500 ease-in-out`}>
          {/* Browser Chrome */}
          <div className="bg-gray-200 rounded-t-xl p-3 border-b">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-600 ml-4">
                Amadeus.com/{pages[currentPage].toLowerCase()}
              </div>
            </div>
          </div>

          {/* Website Content */}
          <div
            className={`bg-gradient-to-br ${theme.background} rounded-b-xl overflow-hidden relative`}
            style={{ height: 'calc(100% - 60px)' }}
          >
            {/* Animated Page Transition */}
            <div
              className="absolute inset-0 transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentPage * 100}%)`,
                width: `${pages.length * 100}%`
              }}
            >
              <div className="flex h-full">
                {pages.map((page, index) => (
                  <div key={index} className="w-full flex-shrink-0 p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-xl shadow-lg animate-pulse"
                          style={{ backgroundColor: theme.primary }}
                        >
                          <div className="w-4 h-4 bg-white rounded"></div>
                        </div>
                        <div>
                          <div
                            className="h-4 w-20 rounded animate-pulse"
                            style={{ backgroundColor: theme.primary }}
                          ></div>
                          <div className="h-2 w-32 bg-gray-300 rounded mt-1"></div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="px-2 py-1 rounded text-white text-xs animate-pulse"
                          style={{ backgroundColor: theme.primary }}
                        >
                          + Ajouter
                        </div>
                        <div
                          className="px-2 py-1 rounded text-white text-xs animate-pulse"
                          style={{ backgroundColor: theme.secondary, animationDelay: '0.1s' }}
                        >
                          ⚙️
                        </div>
                        <div
                          className="px-2 py-1 rounded text-white text-xs animate-pulse"
                          style={{ backgroundColor: theme.accent, animationDelay: '0.2s' }}
                        >
                          📊
                        </div>
                      </div>
                    </div>

                    {/* Stats Cards - Showcasing ALL Colors */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        { color: theme.primary, label: 'Primary', icon: '📊' },
                        { color: theme.secondary, label: 'Secondary', icon: '📈' },
                        { color: theme.accent, label: 'Accent', icon: '✨' },
                        { color: theme.success, label: 'Success', icon: '✅' }
                      ].map((stat, index) => (
                        <div
                          key={stat.label}
                          className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20 animate-pulse"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="h-2 w-12 bg-gray-300 rounded mb-1"></div>
                              <div className="h-3 w-6 rounded" style={{ backgroundColor: stat.color }}></div>
                            </div>
                            <div
                              className="p-1 rounded text-white text-xs flex items-center justify-center w-6 h-6"
                              style={{ backgroundColor: stat.color }}
                            >
                              {stat.icon}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Data Table */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-white/20">
                      {/* Table Header */}
                      <div className="flex items-center gap-3 p-3 border-b border-gray-200">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: theme.primary }}
                        >
                          <div className="w-3 h-3 bg-white rounded"></div>
                        </div>
                        <div>
                          <div className="h-3 w-16 bg-gray-400 rounded mb-1"></div>
                          <div className="h-2 w-24 bg-gray-300 rounded"></div>
                        </div>
                        <div className="ml-auto">
                          <div className="h-6 w-20 bg-gray-200 rounded"></div>
                        </div>
                      </div>

                      {/* Table Rows - Showcasing Status Colors */}
                      <div className="p-3 space-y-2">
                        {[
                          { status: 'success', color: theme.success, label: 'Actif', icon: '✅' },
                          { status: 'warning', color: theme.warning, label: 'En attente', icon: '⚠️' },
                          { status: 'error', color: theme.error, label: 'Erreur', icon: '❌' }
                        ].map((row, index) => (
                          <div
                            key={row.status}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded animate-pulse"
                            style={{ animationDelay: `${index * 0.2}s` }}
                          >
                            <div className="h-3 w-16 bg-gray-300 rounded"></div>
                            <div className="h-3 w-24 bg-gray-300 rounded"></div>
                            <div
                              className="px-2 py-1 rounded-full text-xs text-white font-medium flex items-center gap-1"
                              style={{ backgroundColor: row.color }}
                            >
                              <span>{row.icon}</span>
                              <span>{row.label}</span>
                            </div>
                            <div className="ml-auto flex gap-1">
                              <div
                                className="h-6 w-6 rounded flex items-center justify-center"
                                style={{ backgroundColor: `${theme.info}20` }}
                              >
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.info }}></div>
                              </div>
                              <div
                                className="h-6 w-6 rounded flex items-center justify-center"
                                style={{ backgroundColor: `${theme.accent}20` }}
                              >
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: theme.accent }}></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Complete Color Palette Display */}
                    <div className="mt-3 bg-white/70 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                      <div className="text-xs text-gray-600 mb-2 font-medium">Palette complète:</div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { color: theme.primary, label: 'Primary' },
                          { color: theme.secondary, label: 'Secondary' },
                          { color: theme.accent, label: 'Accent' },
                          { color: theme.success, label: 'Success' },
                          { color: theme.warning, label: 'Warning' },
                          { color: theme.error, label: 'Error' },
                          { color: theme.info, label: 'Info' },
                          { color: theme.text, label: 'Text' }
                        ].map((colorItem, colorIndex) => (
                          <div
                            key={colorItem.label}
                            className="flex flex-col items-center animate-pulse"
                            style={{ animationDelay: `${colorIndex * 0.05}s` }}
                          >
                            <div
                              className="w-4 h-4 rounded border border-white/50 mb-1"
                              style={{ backgroundColor: colorItem.color }}
                            ></div>
                            <div className="text-xs text-gray-500 text-center leading-none">
                              {colorItem.label.slice(0, 3)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Page Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
              {pages.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentPage
                      ? 'w-6'
                      : 'bg-white/50'
                    }`}
                  style={{
                    backgroundColor: index === currentPage ? theme.primary : undefined
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Current Page Info */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
          {getDeviceIcon()}
          <span>Page: {pages[currentPage]}</span>
          {isPlaying && (
            <div className="flex items-center gap-1 ml-2">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600">Live</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
