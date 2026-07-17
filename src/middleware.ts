import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Types for user roles and permissions
type Permission = {
  resource: string
  action: string
}

type UserRole = {
  name: string
  permissions?: Permission[]
}

// Définition des permissions requises pour chaque route
const routePermissions: Record<string, {
  roles?: string[]
  permissions?: string[]
  resource?: string
  action?: string
}> = {
  '/admin': {
    roles: ['Admin', 'Manager', 'User']
  },
  '/admin/users': {
    resource: 'users',
    action: 'read'
  },
  '/admin/roles': {
    resource: 'roles',
    action: 'read'
  },
  '/admin/permissions': {
    resource: 'permissions',
    action: 'read'
  }
}

// Fonction pour vérifier si l'utilisateur a le rôle requis
function hasRole(userRoles: UserRole[], requiredRoles: string[]): boolean {
  if (!userRoles || !requiredRoles) return false
  return requiredRoles.some(role => 
    userRoles.some(userRole => userRole.name === role)
  )
}

// Fonction pour vérifier si l'utilisateur a la permission requise
function hasPermission(userRoles: UserRole[], resource: string, action: string): boolean {
  if (!userRoles) return false
  
  return userRoles.some(role =>
    role.permissions?.some((permission: Permission) => 
      permission.resource === resource && permission.action === action
    )
  )
}

// Supported languages
const supportedLanguages = ['en', 'fr']
const defaultLanguage = 'en'

// Function to get language from request
function getLanguageFromRequest(request: NextRequest): string {
  // Check for language in cookie
  const cookieLang = request.cookies.get('i18next')?.value
  if (cookieLang && supportedLanguages.includes(cookieLang)) {
    return cookieLang
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const preferredLang = acceptLanguage
      .split(',')[0]
      .split('-')[0]
      .toLowerCase()
    
    if (supportedLanguages.includes(preferredLang)) {
      return preferredLang
    }
  }

  return defaultLanguage
}

// Fonction pour vérifier l'accès à une route
function checkRouteAccess(pathname: string, userRoles: UserRole[]): boolean {
  // Trouver la règle de route la plus spécifique
  const matchingRoute = Object.keys(routePermissions)
    .filter(route => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0]

  if (!matchingRoute) {
    // Si aucune règle spécifique, autoriser l'accès
    return true
  }

  const rule = routePermissions[matchingRoute]

  // Si la règle a des permissions spécifiques, les vérifier en premier
  if (rule.resource && rule.action) {
    if (hasPermission(userRoles, rule.resource, rule.action)) {
      return true // L'utilisateur a la permission spécifique
    }
  }

  // Sinon, vérifier les rôles
  if (rule.roles && hasRole(userRoles, rule.roles)) {
    return true
  }

  // Si ni les permissions ni les rôles ne correspondent, refuser l'accès
  return false
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Handle language detection and set cookie
    const detectedLanguage = getLanguageFromRequest(req)
    const response = NextResponse.next()
    
    // Set language cookie if not already set or different
    const currentLangCookie = req.cookies.get('i18next')?.value
    if (!currentLangCookie || currentLangCookie !== detectedLanguage) {
      response.cookies.set('i18next', detectedLanguage, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    }

    // Éviter les boucles de redirection
    if (pathname === '/404' || pathname.startsWith('/auth/')) {
      return response
    }

    // Si pas de token, laisser NextAuth gérer la redirection
    if (!token) {
      return response
    }

    // Vérifier l'accès à la route
    const hasAccess = checkRouteAccess(pathname, token.roles as UserRole[])

    if (!hasAccess) {
      // Rediriger vers une page 404 pour masquer l'existence de la route
      const url = req.nextUrl.clone()
      url.pathname = '/404'
      return NextResponse.redirect(url)
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Toujours autoriser les routes publiques et d'erreur
        if (pathname.startsWith('/auth/') || pathname === '/' || pathname === '/404') {
          return true
        }

        // Exiger une authentification pour les routes admin
        if (pathname.startsWith('/admin')) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|locales).*)'
  ]
}
