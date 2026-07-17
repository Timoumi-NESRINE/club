import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { TrendingUp } from 'lucide-react'
import { useColors } from '../../contexts/ColorContext'
import CustomIcon, { IconName } from '../../components/ui/CustomIcon'

export default function AdminDashboard() {
  const router = useRouter()
  const { currentTheme } = useColors()
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<
    Array<{ name: string; value: string; href: string; icon: IconName; accent: 'primary' | 'green' | 'red' | 'blue' }>
  >([])

  useEffect(() => {
    if (router.query.error === 'access_denied') {
      setErrorMessage('Accès refusé. Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.')
      setTimeout(() => {
        router.replace('/admin', undefined, { shallow: true })
        setErrorMessage('')
      }, 5000)
    }
  }, [router.query.error, router])

  useEffect(() => {
    let isMounted = true

    const fetchTotals = async () => {
      try {
        setIsLoading(true)

        const [usersRes, rolesRes, permsRes, clientsRes] = await Promise.all([
          fetch('/api/users?page=1&limit=1'),
          fetch('/api/roles?page=1&limit=1'),
          fetch('/api/permissions?page=1&limit=1'),
          fetch('/api/clients?page=1&limit=5000'),
        ])

        const [usersJson, rolesJson, permsJson, clientsJson] = await Promise.all([
          usersRes.json(),
          rolesRes.json(),
          permsRes.json(),
          clientsRes.json(),
        ])

        const totalUsers = String(usersJson?.pagination?.total ?? usersJson?.users?.length ?? 0)
        const totalRoles = String(rolesJson?.pagination?.total ?? rolesJson?.roles?.length ?? 0)
        const totalPermissions = String(permsJson?.pagination?.total ?? permsJson?.permissions?.length ?? 0)

        const clients = (clientsJson?.clients ?? clientsJson) as Array<{ phone?: string | null }> | undefined
        const totalClients = String(clientsJson?.pagination?.total ?? clients?.length ?? 0)
        const activeClients = String((clients || []).filter(c => !!c.phone).length)
        const inactiveClients = String((clients || []).filter(c => !c.phone).length)

        const nextStats = [
          { name: 'Utilisateurs', value: totalUsers, href: '/admin/users', icon: 'User' as IconName, accent: 'primary' as const },
          { name: 'Rôles', value: totalRoles, href: '/admin/roles', icon: 'Shield' as IconName, accent: 'blue' as const },
          { name: 'Permissions', value: totalPermissions, href: '/admin/permissions', icon: 'Lock' as IconName, accent: 'blue' as const },
          { name: 'Clients', value: totalClients, href: '/admin/clients', icon: 'User' as IconName, accent: 'primary' as const },
          { name: 'Clients Active', value: activeClients, href: '/admin/clients', icon: 'Sparkles' as IconName, accent: 'green' as const },
          { name: 'Clients Inactive', value: inactiveClients, href: '/admin/clients', icon: 'Warning' as IconName, accent: 'red' as const },
        ]

        if (isMounted) setStats(nextStats)
      } catch (e) {
        console.error('Dashboard stats error:', e)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchTotals()
    return () => {
      isMounted = false
    }
  }, [])

  const quickActions = [
    { name: 'Ajouter un utilisateur', href: '/admin/users', description: 'Créer un nouveau compte', icon: 'Like' as IconName },
    { name: 'Gérer les clients', href: '/admin/clients', description: 'Ajouter / modifier les clients', icon: 'User' as IconName },
    { name: 'Gérer les rôles', href: '/admin/roles', description: 'Configurer les rôles', icon: 'Shield' as IconName },
    { name: 'Voir les permissions', href: '/admin/permissions', description: 'Contrôler les accès', icon: 'Lock' as IconName },
  ]

  return (
    <AdminLayout>
      <div className="min-h-screen">
        <div className="py-4 px-4 sm:py-8 sm:px-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {errorMessage}
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg shadow-sm" style={{ backgroundColor: currentTheme.surface }}>
                  <TrendingUp className="w-8 h-8" style={{ color: currentTheme.primary }} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold" style={{ color: currentTheme.text }}>Tableau de Bord</h1>
                  <p className="mt-1" style={{ color: currentTheme.textSecondary }}>
                    Statistiques et actions rapides
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/users"
                  className="text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 px-4 py-2 rounded-xl font-semibold"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  Ajouter
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm"
                  style={{ backgroundColor: currentTheme.surface }}
                >
                  <div className="h-3 w-20 sm:h-4 sm:w-32 bg-gray-200 rounded mb-3" />
                  <div className="h-6 w-12 sm:h-8 sm:w-16 bg-gray-200 rounded" />
                </div>
              ))
            ) : (
              stats.map((stat) => {
                const accentBg =
                  stat.accent === 'green'
                    ? 'bg-green-100'
                    : stat.accent === 'red'
                      ? 'bg-red-100'
                      : stat.accent === 'blue'
                        ? 'bg-blue-100'
                        : currentTheme.primary

                const accentColorText =
                  stat.accent === 'green'
                    ? '#16a34a'
                    : stat.accent === 'red'
                      ? '#dc2626'
                      : stat.accent === 'blue'
                        ? '#2563eb'
                        : currentTheme.primary

                return (
                  <Link
                    key={stat.name}
                    href={stat.href}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    style={{ backgroundColor: currentTheme.surface }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs sm:text-sm font-medium truncate" style={{ color: currentTheme.textSecondary }}>{stat.name}</p>
                        <p className="text-xl sm:text-2xl font-bold" style={{ color: accentColorText }}>{stat.value}</p>
                      </div>
                      <div className={`p-2 sm:p-3 rounded-xl ${stat.accent !== 'primary' ? accentBg : ''} w-fit`} style={stat.accent === 'primary' ? { backgroundColor: `${currentTheme.primary}20` } : {}}>
                        <div style={{ color: accentColorText }}>
                          <CustomIcon name={stat.icon} className="w-5 h-5 sm:w-6 sm:h-6" iconType={currentTheme.iconType} />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/70 backdrop-blur-sm shadow-sm rounded-2xl border border-gray-100" style={{ backgroundColor: currentTheme.surface }}>
            <div className="px-6 py-8">
              <h3 className="text-xl font-bold mb-6" style={{ color: currentTheme.text }}>
                Actions Rapides
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="relative rounded-2xl border border-gray-100 bg-white/50 px-6 py-6 shadow-sm flex items-center space-x-4 hover:border-purple-200 hover:shadow-md transition-all group overflow-hidden"
                  >
                    <div
                      className="flex-shrink-0 p-3 rounded-lg group-hover:bg-blue-50 transition-colors"
                      style={{ color: currentTheme.primary }}
                    >
                      <CustomIcon
                        name={action.icon}
                        className="w-8 h-8"
                        iconType={action.icon === 'Like' || action.icon === 'Home' ? 'custom' : currentTheme.iconType}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold transition-colors" style={{ color: currentTheme.text }}>
                        {action.name}
                      </p>
                      <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                        {action.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white/70 backdrop-blur-sm shadow-sm rounded-2xl border border-gray-100 overflow-hidden" style={{ backgroundColor: currentTheme.surface }}>
            <div className="px-6 py-8">
              <h3 className="text-xl font-bold mb-6" style={{ color: currentTheme.text }}>
                Activité Récente
              </h3>
              <div className="text-sm text-center py-12" style={{ color: currentTheme.textSecondary }}>
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-lg font-medium" style={{ color: currentTheme.text }}>Aucune activité récente.</p>
                <p className="mt-2" style={{ color: currentTheme.textSecondary }}>
                  L&apos;activité apparaîtra ici lors des modifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
