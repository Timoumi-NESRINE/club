import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface ColorTheme {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  success: string
  warning: string
  error: string
  info: string
  // Sidebar colors
  sidebarBackground: string
  sidebarText: string
  sidebarTextHover: string
  sidebarActiveBackground: string
  sidebarActiveText: string
  sidebarBorder: string
  // Helper colors for theme cards (solid colors extracted from gradients)
  sidebarBackgroundSolid?: string
  sidebarActiveBackgroundSolid?: string
  // Icon style
  iconType?: 'lucide' | 'custom'
}

export const defaultThemes: ColorTheme[] = [
  {
    id: 'club',
    name: 'Club Premium',
    primary: '#7c3aed',
    secondary: '#db2777',
    accent: '#a855f7',
    background: 'from-purple-50 via-white to-pink-50',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    sidebarBackground: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    sidebarText: '#c4b5fd',
    sidebarTextHover: '#a855f7',
    sidebarActiveBackground: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)',
    sidebarActiveText: '#ffffff',
    sidebarBorder: '#4c1d95',
    sidebarBackgroundSolid: '#1e1b4b',
    sidebarActiveBackgroundSolid: '#7c3aed',
    iconType: 'lucide'
  },
  {
    id: 'teal',
    name: 'Teal Ocean',
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
    sidebarBackground: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
    sidebarText: '#94a3b8',
    sidebarTextHover: '#06b6d4',
    sidebarActiveBackground: 'linear-gradient(90deg, #149fad 0%, #06b6d4 100%)',
    sidebarActiveText: '#ffffff',
    sidebarBorder: '#334155',
    sidebarBackgroundSolid: '#0f172a',
    sidebarActiveBackgroundSolid: '#149fad'
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    accent: '#a855f7',
    background: 'from-purple-50 via-violet-50 to-indigo-50',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    sidebarBackground: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
    sidebarText: '#c4b5fd',
    sidebarTextHover: '#a855f7',
    sidebarActiveBackground: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)',
    sidebarActiveText: '#ffffff',
    sidebarBorder: '#4c1d95',
    sidebarBackgroundSolid: '#1e1b4b',
    sidebarActiveBackgroundSolid: '#7c3aed'
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    primary: '#059669',
    secondary: '#10b981',
    accent: '#34d399',
    background: 'from-emerald-50 via-green-50 to-teal-50',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    sidebarBackground: 'linear-gradient(180deg, #064e3b 0%, #065f46 100%)',
    sidebarText: '#a7f3d0',
    sidebarTextHover: '#34d399',
    sidebarActiveBackground: 'linear-gradient(90deg, #059669 0%, #34d399 100%)',
    sidebarActiveText: '#ffffff',
    sidebarBorder: '#047857',
    sidebarBackgroundSolid: '#064e3b',
    sidebarActiveBackgroundSolid: '#059669'
  },
  {
    id: 'orange',
    name: 'Sunset Orange',
    primary: '#ea580c',
    secondary: '#f97316',
    accent: '#fb923c',
    background: 'from-orange-50 via-amber-50 to-yellow-50',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    sidebarBackground: 'linear-gradient(180deg, #7c2d12 0%, #9a3412 100%)',
    sidebarText: '#fed7aa',
    sidebarTextHover: '#fb923c',
    sidebarActiveBackground: 'linear-gradient(90deg, #ea580c 0%, #fb923c 100%)',
    sidebarActiveText: '#ffffff',
    sidebarBorder: '#c2410c',
    sidebarBackgroundSolid: '#7c2d12',
    sidebarActiveBackgroundSolid: '#ea580c'
  },
  {
    id: 'rose',
    name: 'Rose Garden',
    primary: '#e11d48',
    secondary: '#f43f5e',
    accent: '#fb7185',
    background: 'from-rose-50 via-pink-50 to-red-50',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    sidebarBackground: 'linear-gradient(180deg, #881337 0%, #9f1239 100%)',
    sidebarText: '#fda4af',
    sidebarTextHover: '#fb7185',
    sidebarActiveBackground: 'linear-gradient(90deg, #e11d48 0%, #fb7185 100%)',
    sidebarActiveText: '#ffffff',
    sidebarBorder: '#be123c',
    sidebarBackgroundSolid: '#881337',
    sidebarActiveBackgroundSolid: '#e11d48'
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#60a5fa',
    background: 'from-blue-50 via-indigo-50 to-purple-50',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    sidebarBackground: 'linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 100%)',
    sidebarText: '#bfdbfe',
    sidebarTextHover: '#60a5fa',
    sidebarActiveBackground: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
    sidebarActiveText: '#ffffff',
    sidebarBorder: '#1e40af',
    sidebarBackgroundSolid: '#1e3a8a',
    sidebarActiveBackgroundSolid: '#2563eb'
  }
]

interface ColorContextType {
  currentTheme: ColorTheme
  themes: ColorTheme[]
  setTheme: (themeId: string) => void
  addCustomTheme: (theme: ColorTheme) => void
  updateTheme: (theme: ColorTheme) => void
  deleteTheme: (themeId: string) => void
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

interface ColorProviderProps {
  children: ReactNode
}

export function ColorProvider({ children }: ColorProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(defaultThemes[0])
  const [themes, setThemes] = useState<ColorTheme[]>(defaultThemes)

  // Load saved theme from localStorage
  useEffect(() => {
    const savedThemeId = localStorage.getItem('Club-theme')
    const savedCustomThemes = localStorage.getItem('Club-custom-themes')

    let allThemes = [...defaultThemes]

    if (savedCustomThemes) {
      try {
        const customThemes = JSON.parse(savedCustomThemes)
        // Ensure custom themes have all required properties
        const validCustomThemes = customThemes.map((theme: ColorTheme) => ({
          ...theme,
          sidebarBackground: theme.sidebarBackground || '#ffffff',
          sidebarText: theme.sidebarText || '#6b7280',
          sidebarTextHover: theme.sidebarTextHover || theme.primary || '#149fad',
          sidebarActiveBackground: theme.sidebarActiveBackground || theme.primary || '#149fad',
          sidebarActiveText: theme.sidebarActiveText || '#ffffff',
          sidebarBorder: theme.sidebarBorder || '#e5e7eb',
          sidebarBackgroundSolid: theme.sidebarBackgroundSolid || theme.sidebarBorder || '#e5e7eb',
          sidebarActiveBackgroundSolid: theme.sidebarActiveBackgroundSolid || theme.primary || '#149fad'
        }))
        allThemes = [...defaultThemes, ...validCustomThemes]
        setThemes(allThemes)
      } catch (error) {
        console.error('Error loading custom themes:', error)
      }
    }

    if (savedThemeId) {
      const theme = allThemes.find(t => t.id === savedThemeId)
      if (theme) {
        setCurrentTheme(theme)
      }
    }
  }, [])

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', currentTheme.primary)
    root.style.setProperty('--color-secondary', currentTheme.secondary)
    root.style.setProperty('--color-accent', currentTheme.accent)
    root.style.setProperty('--color-surface', currentTheme.surface)
    root.style.setProperty('--color-text', currentTheme.text)
    root.style.setProperty('--color-text-secondary', currentTheme.textSecondary)
    root.style.setProperty('--color-success', currentTheme.success)
    root.style.setProperty('--color-warning', currentTheme.warning)
    root.style.setProperty('--color-error', currentTheme.error)
    root.style.setProperty('--color-info', currentTheme.info)
    // Sidebar colors
    root.style.setProperty('--sidebar-background', currentTheme.sidebarBackground)
    root.style.setProperty('--sidebar-text', currentTheme.sidebarText)
    root.style.setProperty('--sidebar-text-hover', currentTheme.sidebarTextHover)
    root.style.setProperty('--sidebar-active-background', currentTheme.sidebarActiveBackground)
    root.style.setProperty('--sidebar-active-text', currentTheme.sidebarActiveText)
    root.style.setProperty('--sidebar-border', currentTheme.sidebarBorder)
  }, [currentTheme])

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId)
    if (theme) {
      setCurrentTheme(theme)
      localStorage.setItem('Club-theme', themeId)
    }
  }

  const addCustomTheme = (theme: ColorTheme) => {
    const newThemes = [...themes, theme]
    setThemes(newThemes)

    const customThemes = newThemes.filter(t => !defaultThemes.find(dt => dt.id === t.id))
    localStorage.setItem('Club-custom-themes', JSON.stringify(customThemes))
  }

  const updateTheme = (updatedTheme: ColorTheme) => {
    const newThemes = themes.map(t => t.id === updatedTheme.id ? updatedTheme : t)
    setThemes(newThemes)

    if (currentTheme.id === updatedTheme.id) {
      setCurrentTheme(updatedTheme)
    }

    const customThemes = newThemes.filter(t => !defaultThemes.find(dt => dt.id === t.id))
    localStorage.setItem('Club-custom-themes', JSON.stringify(customThemes))
  }

  const deleteTheme = (themeId: string) => {
    if (defaultThemes.find(t => t.id === themeId)) {
      return // Cannot delete default themes
    }

    const newThemes = themes.filter(t => t.id !== themeId)
    setThemes(newThemes)

    if (currentTheme.id === themeId) {
      setCurrentTheme(defaultThemes[0])
      localStorage.setItem('Club-theme', defaultThemes[0].id)
    }

    const customThemes = newThemes.filter(t => !defaultThemes.find(dt => dt.id === t.id))
    localStorage.setItem('Club-custom-themes', JSON.stringify(customThemes))
  }

  return (
    <ColorContext.Provider value={{
      currentTheme,
      themes,
      setTheme,
      addCustomTheme,
      updateTheme,
      deleteTheme
    }}>
      {children}
    </ColorContext.Provider>
  )
}

export function useColors() {
  const context = useContext(ColorContext)
  if (context === undefined) {
    throw new Error('useColors must be used within a ColorProvider')
  }
  return context
}
