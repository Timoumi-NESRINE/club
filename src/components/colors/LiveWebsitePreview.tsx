import { useState, useEffect, useRef } from 'react'
import { ColorTheme } from '../../contexts/ColorContext'
import {
  Monitor,
  Smartphone,
  Tablet,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Loader,
  Zap,
  Eye
} from 'lucide-react'

interface LiveWebsitePreviewProps {
  theme: ColorTheme
  isAnimated?: boolean
}

export default function LiveWebsitePreview({ theme, isAnimated = false }: LiveWebsitePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isPlaying, setIsPlaying] = useState(isAnimated)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const pages = [
    { name: 'Dashboard', path: '/admin', title: 'Tableau de bord' },
    { name: 'Users', path: '/admin/users', title: 'Utilisateurs' }
  ]

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setIsLoading(true) // Show loading when switching pages
      setTimeout(() => {
        setCurrentPageIndex(prev => (prev + 1) % pages.length)
      }, 500) // Small delay to show loading state
    }, 8000) // Much slower transition to allow pages to fully load

    return () => clearInterval(interval)
  }, [isPlaying, pages.length])

  // Apply theme to iframe when it loads
  useEffect(() => {
    const applyThemeToIframe = () => {
      if (!iframeRef.current?.contentWindow) return

      try {
        const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document
        if (!iframeDoc) return

        // Apply CSS custom properties to iframe
        const root = iframeDoc.documentElement
        root.style.setProperty('--color-primary', theme.primary)
        root.style.setProperty('--color-secondary', theme.secondary)
        root.style.setProperty('--color-accent', theme.accent)
        root.style.setProperty('--color-surface', theme.surface)
        root.style.setProperty('--color-text', theme.text)
        root.style.setProperty('--color-text-secondary', theme.textSecondary)
        root.style.setProperty('--color-success', theme.success)
        root.style.setProperty('--color-warning', theme.warning)
        root.style.setProperty('--color-error', theme.error)
        root.style.setProperty('--color-info', theme.info)
        root.style.setProperty('--sidebar-background', theme.sidebarBackground)
        root.style.setProperty('--sidebar-text', theme.sidebarText)
        root.style.setProperty('--sidebar-text-hover', theme.sidebarTextHover)
        root.style.setProperty('--sidebar-active-background', theme.sidebarActiveBackground)
        root.style.setProperty('--sidebar-active-text', theme.sidebarActiveText)
        root.style.setProperty('--sidebar-border', theme.sidebarBorder)



        // Force update sidebar container specifically
        const sidebarContainer = iframeDoc.querySelector('div[class*="fixed"][class*="inset-y-0"][class*="left-0"]') as HTMLElement
        if (sidebarContainer) {
          sidebarContainer.style.background = theme.sidebarBackground
          sidebarContainer.style.borderRight = `1px solid ${theme.sidebarBorder}`
        }

        // Force update all sidebar elements with background styles
        const sidebarElements = iframeDoc.querySelectorAll('div[class*="fixed"] [style*="background"], div[class*="w-64"] [style*="background"]')
        sidebarElements.forEach((element) => {
          const htmlElement = element as HTMLElement
          if (htmlElement.style.background) {
            // If it's a navigation link with gradient, use active background
            if (htmlElement.tagName === 'A' && htmlElement.style.background.includes('linear-gradient')) {
              htmlElement.style.background = theme.sidebarActiveBackground
              htmlElement.style.color = theme.sidebarActiveText
            } else if (htmlElement.style.background.includes('linear-gradient')) {
              // If it's the sidebar container, use sidebar background
              htmlElement.style.background = theme.sidebarBackground
            }
          }
        })

        // Force update all navigation links
        const navLinks = iframeDoc.querySelectorAll('div[class*="fixed"] nav a')
        navLinks.forEach((link) => {
          const linkElement = link as HTMLElement
          // Reset all links to default state first
          linkElement.style.color = theme.sidebarText
          linkElement.style.background = 'transparent'

          // Then apply active state if it has background
          if (linkElement.style.background && linkElement.style.background !== 'transparent') {
            linkElement.style.background = theme.sidebarActiveBackground
            linkElement.style.color = theme.sidebarActiveText
          }
        })

        // Remove existing theme styles
        const existingStyle = iframeDoc.getElementById('dynamic-theme-styles')
        if (existingStyle) {
          existingStyle.remove()
        }

        // Apply theme-specific styles
        const style = iframeDoc.createElement('style')
        style.id = 'dynamic-theme-styles'
        style.textContent = `
          /* Override existing styles with theme colors */
          .bg-teal-500, .bg-\\[\\#149fad\\] { background-color: ${theme.primary} !important; }
          .bg-teal-600 { background-color: ${theme.secondary} !important; }
          .bg-cyan-600 { background-color: ${theme.accent} !important; }
          .text-teal-600 { color: ${theme.primary} !important; }
          .border-teal-500 { border-color: ${theme.primary} !important; }
          .ring-teal-500 { --tw-ring-color: ${theme.primary} !important; }
          
          /* Gradient backgrounds */
          .bg-gradient-to-br.from-teal-50.via-cyan-50.to-blue-50 {
            background: linear-gradient(to bottom right, ${theme.primary}10, ${theme.accent}10, ${theme.secondary}10) !important;
          }
          
          /* Button gradients */
          .bg-gradient-to-r.from-teal-500.to-cyan-600 {
            background: linear-gradient(to right, ${theme.primary}, ${theme.accent}) !important;
          }
          
          /* ULTRA AGGRESSIVE SIDEBAR OVERRIDE - Match exact styling */
          
          /* Force sidebar container background - highest specificity */
          div[class*="fixed"][class*="inset-y-0"][class*="left-0"][class*="z-40"],
          div[class*="w-64"][class*="shadow-lg"][class*="transform"],
          div[class*="w-16"][class*="shadow-lg"][class*="transform"] {
            background: ${theme.sidebarBackground} !important;
            border-right: 1px solid ${theme.sidebarBorder} !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          }
          
          /* Override any existing sidebar backgrounds */
          div[class*="fixed"] div,
          div[class*="w-64"] div,
          div[class*="w-16"] div {
            background: transparent !important;
          }
          
          /* Force navigation container to be transparent */
          div[class*="fixed"] nav,
          div[class*="fixed"] nav div {
            background: transparent !important;
          }
          
          /* Reset all navigation links to default state */
          div[class*="fixed"] nav a,
          div[class*="fixed"] nav div a {
            background: transparent !important;
            color: ${theme.sidebarText} !important;
            border-radius: 0.375rem 0 0 0.375rem !important;
            transition: all 0.2s ease !important;
            border-right: none !important;
            margin: 0.125rem 0 !important;
            padding: 0.5rem 0.75rem !important;
          }
          
          /* Navigation hover states */
          div[class*="fixed"] nav a:hover,
          div[class*="fixed"] nav div a:hover {
            background: ${theme.sidebarTextHover}15 !important;
            color: ${theme.sidebarTextHover} !important;
          }
          
          /* Force active navigation states - multiple selectors */
          div[class*="fixed"] nav a[style*="background"]:not([style*="transparent"]),
          div[class*="fixed"] nav div a[style*="background"]:not([style*="transparent"]),
          div[class*="fixed"] nav a[class*="bg-"],
          div[class*="fixed"] nav a[class*="text-blue"],
          div[class*="fixed"] nav a[class*="border-blue"] {
            background: ${theme.sidebarActiveBackground} !important;
            color: ${theme.sidebarActiveText} !important;
            border-right: 3px solid ${theme.sidebarTextHover} !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }
          
          /* Force all gradient elements in sidebar to use theme background */
          div[class*="fixed"] [style*="linear-gradient"],
          div[class*="w-64"] [style*="linear-gradient"],
          div[class*="w-16"] [style*="linear-gradient"] {
            background: ${theme.sidebarBackground} !important;
          }
          
          /* Override CSS variables if they exist */
          [style*="var(--sidebar-background)"] {
            background: ${theme.sidebarBackground} !important;
          }
          
          [style*="var(--sidebar-active-background)"] {
            background: ${theme.sidebarActiveBackground} !important;
          }
          
          [style*="var(--sidebar-text)"] {
            color: ${theme.sidebarText} !important;
          }
          
          [style*="var(--sidebar-active-text)"] {
            color: ${theme.sidebarActiveText} !important;
          }
          
          [style*="var(--sidebar-border)"] {
            border-color: ${theme.sidebarBorder} !important;
          }
          
          /* Smooth transitions for theme changes */
          * {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
          }
        `
        iframeDoc.head.appendChild(style)
      } catch {
        console.log('Cross-origin iframe access restricted')
      }
    }

    // Apply theme when iframe loads
    const iframeElement = iframeRef.current
    if (iframeElement) {
      iframeElement.addEventListener('load', () => {
        setTimeout(() => setIsLoading(false), 1500) // Give extra time for page to render
        setTimeout(applyThemeToIframe, 500) // Longer delay to ensure DOM is ready
        setTimeout(applyThemeToIframe, 1000) // Apply again after 1 second
        setTimeout(applyThemeToIframe, 2000) // Apply again after 2 seconds
      })
    }

    // Apply theme when theme changes
    applyThemeToIframe()

    // Force iframe refresh when theme changes to ensure sidebar updates
    const iframeEl = iframeRef.current
    if (iframeEl) {
      const currentSrc = iframeEl.src
      // Force reload the iframe to pick up new theme
      iframeEl.src = 'about:blank'
      setTimeout(() => {
        iframeEl.src = currentSrc
        setIsLoading(true)
      }, 100)
    }
  }, [theme])

  const getDeviceClasses = () => {
    switch (viewMode) {
      case 'mobile':
        return { width: '375px', height: '667px', scale: 0.8 }
      case 'tablet':
        return { width: '768px', height: '1024px', scale: 0.6 }
      default:
        return { width: '1200px', height: '800px', scale: 0.7 }
    }
  }

  const deviceConfig = getDeviceClasses()
  const currentPage = pages[currentPageIndex]

  const handlePageChange = (index: number) => {
    setCurrentPageIndex(index)
    setIsLoading(true)
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Aperçu en temps réel</h4>
            <p className="text-sm text-gray-600">Application réelle avec votre thème</p>
          </div>
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
            className={`p-2 rounded-lg transition-colors ${isPlaying
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 hover:bg-gray-200'
              }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => handlePageChange(0)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <a
            href={currentPage.path}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Page Navigation Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto">
        {pages.map((page, index) => (
          <button
            key={page.name}
            onClick={() => handlePageChange(index)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${index === currentPageIndex
                ? 'text-white shadow-lg transform scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            style={{
              backgroundColor: index === currentPageIndex ? theme.primary : undefined
            }}
          >
            {page.title}
          </button>
        ))}
      </div>

      {/* Live Website Frame */}
      <div className="flex justify-center">
        <div
          className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl transition-all duration-500"
          style={{
            width: deviceConfig.width,
            height: deviceConfig.height,
            transform: `scale(${deviceConfig.scale})`
          }}
        >
          {/* Device Frame */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 p-3">
            {/* Browser Chrome */}
            <div className="bg-gray-200 rounded-t-lg p-3 mb-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-600 ml-4 flex items-center gap-2">
                  {isLoading && <Loader className="w-3 h-3 animate-spin" />}
                  <span>localhost:3000{currentPage.path}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>

            {/* Live Website Content */}
            <div className="relative bg-white rounded-b-lg overflow-hidden" style={{ height: 'calc(100% - 60px)' }}>
              {isLoading && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
                  <div className="flex items-center gap-3">
                    <Loader className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-gray-600 font-medium">Chargement de {currentPage.title}...</span>
                  </div>
                </div>
              )}

              <iframe
                ref={iframeRef}
                src={currentPage.path}
                className="w-full h-full border-0"
                title={`Preview of ${currentPage.title}`}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                onLoad={() => {
                  // Give extra time for the page to fully render
                  setTimeout(() => setIsLoading(false), 1500)
                }}
              />
            </div>
          </div>

          {/* Theme Indicator */}
          <div className="absolute top-6 right-6 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border border-white/30"
              style={{ backgroundColor: theme.primary }}
            ></div>
            <span>{theme.name}</span>
          </div>

          {/* Live Indicator */}
          {isPlaying && (
            <div className="absolute bottom-6 left-6 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Page Info */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
            <Monitor className="w-4 h-4" />
            <span>{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
            <Eye className="w-4 h-4" />
            <span>{currentPage.title}</span>
          </div>
        </div>

        {/* Auto-play Progress */}
        {isPlaying && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Prochaine page dans</span>
            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  backgroundColor: theme.primary,
                  width: '100%',
                  animation: 'progress 8s linear infinite'
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}
