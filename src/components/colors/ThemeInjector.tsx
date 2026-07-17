import { useEffect } from 'react'
import { useColors } from '../../contexts/ColorContext'

// This component injects theme styles globally for iframe compatibility
export default function ThemeInjector() {
  const { currentTheme } = useColors()

  useEffect(() => {
    // Create or update global theme styles
    let styleElement = document.getElementById('global-theme-styles') as HTMLStyleElement
    
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'global-theme-styles'
      document.head.appendChild(styleElement)
    }

    // Generate comprehensive theme CSS
    const themeCSS = `
      :root {
        --color-primary: ${currentTheme.primary};
        --color-secondary: ${currentTheme.secondary};
        --color-accent: ${currentTheme.accent};
        --color-surface: ${currentTheme.surface};
        --color-text: ${currentTheme.text};
        --color-text-secondary: ${currentTheme.textSecondary};
        --color-success: ${currentTheme.success};
        --color-warning: ${currentTheme.warning};
        --color-error: ${currentTheme.error};
        --color-info: ${currentTheme.info};
        --sidebar-background: ${currentTheme.sidebarBackground};
        --sidebar-text: ${currentTheme.sidebarText};
        --sidebar-text-hover: ${currentTheme.sidebarTextHover};
        --sidebar-active-background: ${currentTheme.sidebarActiveBackground};
        --sidebar-active-text: ${currentTheme.sidebarActiveText};
        --sidebar-border: ${currentTheme.sidebarBorder};
      }

      /* Override Tailwind classes with theme colors */
      .bg-teal-500,
      .bg-\\[\\#149fad\\] {
        background-color: ${currentTheme.primary} !important;
      }

      .bg-teal-600 {
        background-color: ${currentTheme.secondary} !important;
      }

      .bg-cyan-600,
      .bg-teal-400 {
        background-color: ${currentTheme.accent} !important;
      }

      .text-teal-600,
      .text-\\[\\#149fad\\] {
        color: ${currentTheme.primary} !important;
      }

      .border-teal-500 {
        border-color: ${currentTheme.primary} !important;
      }

      .ring-teal-500\\/20 {
        --tw-ring-color: ${currentTheme.primary}33 !important;
      }

      .focus\\:border-teal-500:focus {
        border-color: ${currentTheme.primary} !important;
      }

      .focus\\:ring-teal-500\\/20:focus {
        --tw-ring-color: ${currentTheme.primary}33 !important;
      }

      /* Gradient backgrounds */
      .bg-gradient-to-br.from-teal-50.via-cyan-50.to-blue-50,
      .bg-gradient-to-br.from-teal-50.to-cyan-50 {
        background: linear-gradient(to bottom right, 
          ${currentTheme.primary}08, 
          ${currentTheme.accent}08, 
          ${currentTheme.secondary}08) !important;
      }

      /* Button gradients */
      .bg-gradient-to-r.from-teal-500.to-cyan-600 {
        background: linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.accent}) !important;
      }

      .hover\\:from-teal-600.hover\\:to-cyan-700:hover {
        background: linear-gradient(to right, ${currentTheme.secondary}, ${currentTheme.accent}) !important;
      }

      /* Icon backgrounds */
      .bg-teal-100 {
        background-color: ${currentTheme.primary}20 !important;
      }

      /* Status colors */
      .bg-emerald-100 {
        background-color: ${currentTheme.success}20 !important;
      }

      .text-emerald-600 {
        color: ${currentTheme.success} !important;
      }

      .bg-red-100 {
        background-color: ${currentTheme.error}20 !important;
      }

      .text-red-600 {
        color: ${currentTheme.error} !important;
      }

      .bg-blue-100 {
        background-color: ${currentTheme.info}20 !important;
      }

      .text-blue-600 {
        color: ${currentTheme.info} !important;
      }

      .bg-orange-100 {
        background-color: ${currentTheme.warning}20 !important;
      }

      .text-orange-600 {
        color: ${currentTheme.warning} !important;
      }

      /* Purple theme colors for color page */
      .bg-purple-100 {
        background-color: ${currentTheme.accent}20 !important;
      }

      .text-purple-600 {
        color: ${currentTheme.accent} !important;
      }

      .bg-gradient-to-r.from-purple-500.to-pink-600 {
        background: linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.accent}) !important;
      }

      /* Sidebar specific overrides */
      .sidebar-gradient {
        background: ${currentTheme.sidebarBackground} !important;
      }
      
      .sidebar-active-gradient {
        background: ${currentTheme.sidebarActiveBackground} !important;
      }

      /* Smooth transitions for all theme changes */
      * {
        transition: background 0.3s ease, 
                   background-color 0.3s ease, 
                   color 0.3s ease, 
                   border-color 0.3s ease,
                   box-shadow 0.3s ease !important;
      }

      /* Animation for theme changes */
      @keyframes themeChange {
        0% { opacity: 0.8; transform: scale(0.98); }
        50% { opacity: 1; transform: scale(1.01); }
        100% { opacity: 1; transform: scale(1); }
      }

      .theme-transition {
        animation: themeChange 0.5s ease-out;
      }
    `

    styleElement.textContent = themeCSS

    // Add theme change animation class to body
    document.body.classList.add('theme-transition')
    setTimeout(() => {
      document.body.classList.remove('theme-transition')
    }, 500)

  }, [currentTheme])

  return null // This component doesn't render anything
}
