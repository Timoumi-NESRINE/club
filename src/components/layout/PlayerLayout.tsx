import { useRouter } from 'next/router'
import { ReactNode, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from './Navbar'
import { useColors } from '../../contexts/ColorContext'

interface PlayerLayoutProps {
  children: ReactNode
}

export default function PlayerLayout({ children }: PlayerLayoutProps) {
  const router = useRouter()
  const { status } = useSession()
  const { currentTheme } = useColors()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Persist sidebar collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
  }

  // Rediriger vers la page de connexion si non authentifié
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  // Player-specific menu items
  const playerMenuItems = [
    { 
      icon: 'Home', 
      label: 'Tableau de bord', 
      href: '/player',
      id: 'player-dashboard'
    },
    { 
      icon: 'Calendar', 
      label: 'Calendrier', 
      href: '/player/calendar',
      id: 'player-calendar'
    },
    { 
      icon: 'FileText', 
      label: 'Documents', 
      href: '/player/documents',
      id: 'player-documents'
    },
    { 
      icon: 'User', 
      label: 'Profil', 
      href: '/player/profile',
      id: 'player-profile'
    },
  ]

  return (
    <div className={`h-screen bg-gradient-to-br ${currentTheme.background} flex flex-col overflow-hidden`}>
      {/* Navbar - Same as admin */}
      <Navbar
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Modified for player */}
        <div className={`
          ${sidebarOpen ? 'block' : 'hidden'}
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
          lg:block bg-white shadow-lg transition-all duration-300 flex-shrink-0
        `} style={{ backgroundColor: currentTheme.surface }}>
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              {playerMenuItems.map((item) => {
                const isActive = router.pathname === item.href
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition
                      ${sidebarCollapsed ? 'justify-center' : ''}
                      ${isActive 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className={`
                      ${sidebarCollapsed ? '' : 'mr-3'}
                      flex-shrink-0 w-5 h-5 flex items-center justify-center
                    `}>
                      {item.icon === 'Home' && (
                        <svg className={`w-5 h-5 ${isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      )}
                      {item.icon === 'Calendar' && (
                        <svg className={`w-5 h-5 ${isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {item.icon === 'FileText' && (
                        <svg className={`w-5 h-5 ${isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {item.icon === 'User' && (
                        <svg className={`w-5 h-5 ${isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <span>{item.label}</span>
                    )}
                  </a>
                )
              })}
            </div>
          </nav>
        </div>

        {/* Main content - Same as admin */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile overlay - Same as admin */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
