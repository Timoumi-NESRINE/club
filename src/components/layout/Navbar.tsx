import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  LogOut
} from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useColors } from '../../contexts/ColorContext'
import CustomIcon from '../ui/CustomIcon'

interface NavbarProps {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  onMobileMenuToggle?: () => void
}

export default function Navbar({ sidebarCollapsed, toggleSidebar, onMobileMenuToggle }: NavbarProps) {
  const { data: session } = useSession()
  const { t, changeLanguage, currentLanguage } = useTranslation()
  const { currentTheme } = useColors()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const langDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    // First, log the logout with IP and userAgent
    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch (error) {
      console.error('Failed to log logout:', error)
    }
    // Then sign out
    signOut({ callbackUrl: '/' })
  }

  const getUserInitials = () => {
    const firstName = session?.user?.firstName || ''
    const lastName = session?.user?.lastName || ''
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
  }

  const getLanguageName = (lang: string) => {
    return lang === 'fr' ? 'Français' : 'English'
  }

  return (
    <nav className="sticky top-0 z-50 shadow-sm border-b h-16 flex items-center justify-between px-4 lg:px-6"
         style={{ backgroundColor: currentTheme.surface, borderColor: currentTheme.sidebarBorder }}>
      {/* Left side - Sidebar toggle and title */}
      <div className="flex items-center space-x-4">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden text-gray-500 hover:text-gray-700 p-2"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:block text-gray-500 hover:text-gray-700 p-2 transition-transform duration-300"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ transform: sidebarCollapsed ? 'none' : 'rotate(180deg)' }}
        >
          <CustomIcon name="NavbarExpand" className="w-6 h-6" iconType="custom" invert={false} />
        </button>

        <div className="flex items-center">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
              C
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
              CLUB
            </span>
          </div>
        </div>
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center space-x-4">
        {/* Notifications (optional) */}
        <button className="text-gray-500 hover:text-gray-700 p-2 relative">
          <Bell className="w-6 h-6" />
          {/* Notification badge */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Language selector */}
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="flex items-center space-x-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-2 hover:bg-gray-50"
          >
            <CustomIcon name="Language" className="w-6 h-6" iconType="custom" invert={false} />
            <span className="hidden sm:block" style={{ color: currentTheme.text }}>{getLanguageName(currentLanguage)}</span>
            <ChevronDown className="w-4 h-4" style={{ color: currentTheme.textSecondary }} />
          </button>

          {/* Language dropdown menu */}
          {langDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    changeLanguage('en')
                    setLangDropdownOpen(false)
                  }}
                  className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${currentLanguage === 'en' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                >
                  <span className="mr-3 text-lg">🇺🇸</span>
                  English
                </button>
                <button
                  onClick={() => {
                    changeLanguage('fr')
                    setLangDropdownOpen(false)
                  }}
                  className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${currentLanguage === 'fr' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                >
                  <span className="mr-3 text-lg">🇫🇷</span>
                  Français
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-2 hover:bg-gray-50"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium hidden sm:block" style={{ color: currentTheme.text }}>
                {session?.user?.firstName} {session?.user?.lastName}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm transition-transform group-hover:scale-110"
                style={{ backgroundColor: currentTheme.primary }}
              >
                {getUserInitials()}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-md"
                      style={{ backgroundColor: currentTheme.primary }}
                    >
                      {getUserInitials()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {session?.user?.firstName} {session?.user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session?.user?.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {session?.user?.roles?.map(r => r.name).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      // Add profile navigation here
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-4 h-4 mr-3" />
                    {t('navigation.profile')}
                  </button>


                </div>

                {/* Logout */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      handleSignOut()
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    {t('auth.signOut')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
