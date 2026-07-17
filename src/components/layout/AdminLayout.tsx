import { useRouter } from 'next/router'
import { ReactNode, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useColors } from '../../contexts/ColorContext'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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

  return (
    <div className={`h-screen bg-gradient-to-br ${currentTheme.background} flex flex-col overflow-hidden`}>
      {/* Navbar */}
      <Navbar
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          key={currentTheme.id}
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
