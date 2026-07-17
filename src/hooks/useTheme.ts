import { useColors } from '../contexts/ColorContext'

export function useTheme() {
  const { currentTheme } = useColors()
  
  return {
    // Primary colors
    primary: currentTheme.primary,
    secondary: currentTheme.secondary,
    accent: currentTheme.accent,
    
    // Background and surface
    background: currentTheme.background,
    surface: currentTheme.surface,
    
    // Text colors
    text: currentTheme.text,
    textSecondary: currentTheme.textSecondary,
    
    // Status colors
    success: currentTheme.success,
    warning: currentTheme.warning,
    error: currentTheme.error,
    info: currentTheme.info,
    
    // CSS custom properties (for use in className)
    css: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
      accent: 'var(--color-accent)',
      surface: 'var(--color-surface)',
      text: 'var(--color-text)',
      textSecondary: 'var(--color-text-secondary)',
      success: 'var(--color-success)',
      warning: 'var(--color-warning)',
      error: 'var(--color-error)',
      info: 'var(--color-info)'
    },
    
    // Utility functions
    getButtonClasses: (variant: 'primary' | 'secondary' | 'accent' = 'primary') => {
      const baseClasses = 'px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl'
      
      switch (variant) {
        case 'primary':
          return `${baseClasses} text-white`
        case 'secondary':
          return `${baseClasses} text-white`
        case 'accent':
          return `${baseClasses} text-white`
        default:
          return `${baseClasses} text-white`
      }
    },
    
    getIconBackgroundClasses: () => {
      return 'p-2 rounded-xl shadow-lg'
    },
    
    getSectionClasses: () => {
      return 'bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm'
    }
  }
}
