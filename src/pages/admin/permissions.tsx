import { useState, useEffect, useCallback, useMemo } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { Permission } from '../../types'
import { useTranslation } from '@/lib/hooks/useTranslation'
import CustomIcon from '@/components/ui/CustomIcon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function PermissionsPage() {
  const { t } = useTranslation()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeResource, setActiveResource] = useState<string>('all')

  const getPermissionTitle = useCallback(
    (permission: Permission) => {
      const permissionKey = (permission.name || '').trim().toLowerCase()
      const key = `permissions.names.${permissionKey}`
      // Permission keys contain ':' (e.g. clients:create). i18next treats ':' as namespace separator by default.
      // Disable nsSeparator to allow translating literal keys.
      const translated = t(key, { nsSeparator: false })

      // i18next returns the key itself when missing
      if (translated && translated !== key) return translated

      return permission.name
    },
    [t]
  )

  const getPermissionDescription = useCallback(
    (permission: Permission) => {
      const permissionKey = (permission.name || '').trim().toLowerCase()
      const key = `permissions.descriptions.${permissionKey}`
      const translated = t(key, { nsSeparator: false })

      if (translated && translated !== key) return translated
      return permission.description || ''
    },
    [t]
  )

  const getResourceLabel = useCallback(
    (resource?: string | null) => {
      const r = (resource || 'General').trim()
      const key = `permissions.resources.${r}`
      const translated = t(key)

      if (translated && translated !== key) return translated
      return r
    },
    [t]
  )

  const getActionLabel = useCallback(
    (action: string) => {
      const normalized = action.toLowerCase()
      const key = `permissions.actions.${normalized}`
      const translated = t(key)

      // i18next returns the key itself when missing
      if (translated && translated !== key) return translated

      return action
    },
    [t]
  )

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '100',
        ...(search && { search }),
      })

      const response = await fetch(`/api/permissions?${params}`)
      const data = await response.json()

      if (response.ok) {
        setPermissions(data.permissions)
      } else {
        console.error('Failed to fetch permissions:', data.error)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  // Group permissions by resource for the sidebar
  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, permission) => {
      const resource = permission.resource || 'General'
      if (!acc[resource]) {
        acc[resource] = []
      }
      acc[resource].push(permission)
      return acc
    }, {} as Record<string, Permission[]>)
  }, [permissions])

  const resources = useMemo(() =>
    Object.keys(groupedPermissions).sort(),
    [groupedPermissions]
  )

  // Filter permissions based on active resource
  const filteredPermissions = useMemo(() => {
    if (activeResource === 'all') return permissions
    return groupedPermissions[activeResource] || []
  }, [activeResource, permissions, groupedPermissions])

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'read': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'update': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'delete': return 'bg-rose-100 text-rose-700 border-rose-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <AdminLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200 px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t('admin.permissions')}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('permissions.systemPermissionsDescription')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-64 lg:w-80">
                <CustomIcon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" iconType="lucide" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('permissions.searchPlaceholder')}
                  className="pl-10 bg-white border-gray-200 focus:ring-blue-500 rounded-full h-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchPermissions()}
                className="rounded-full h-10 w-10 border-gray-200 hover:bg-white"
              >
                <div className={cn("transition-all duration-500", loading && "animate-spin")}>
                  <CustomIcon name="Sparkles" className="h-4 w-4" iconType="lucide" />
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Resources */}
          <div className="w-64 bg-gray-50/50 border-r border-gray-200 overflow-y-auto hidden md:block">
            <div className="p-4 space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                {t('permissions.resourceFilter')}
              </h3>

              <button
                onClick={() => setActiveResource('all')}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all",
                  activeResource === 'all'
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <CustomIcon name="Shield" className={cn("h-4 w-4", activeResource === 'all' ? "text-blue-500" : "text-gray-400")} />
                  <span>{t('permissions.allResources')}</span>
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  activeResource === 'all' ? "bg-blue-50 text-blue-600" : "bg-gray-200 text-gray-500"
                )}>
                  {permissions.length}
                </span>
              </button>

              {resources.map((resource) => (
                <button
                  key={resource}
                  onClick={() => setActiveResource(resource)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all mt-1",
                    activeResource === resource
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <CustomIcon name="Folder" className={cn("h-4 w-4", activeResource === resource ? "text-blue-500" : "text-gray-400")} iconType="lucide" />
                    <span className="truncate">{getResourceLabel(resource)}</span>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    activeResource === resource ? "bg-blue-50 text-blue-600" : "bg-gray-200 text-gray-500"
                  )}>
                    {groupedPermissions[resource].length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Content - Permissions List */}
          <div className="flex-1 overflow-y-auto bg-gray-50/30 p-8 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CustomIcon name="Lock" className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                <p className="text-gray-500 font-medium animate-pulse">{t('common.loading')}</p>
              </div>
            ) : filteredPermissions.length > 0 ? (
              <div className="max-w-5xl mx-auto space-y-6">
                {/* Resource Title (Mobile or specific filter) */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    {activeResource === 'all' ? (
                      <>{t('permissions.allPermissions')}</>
                    ) : (
                      <>
                        <span className="text-blue-500">
                          {getResourceLabel(activeResource)}
                        </span>
                        <span className="text-gray-400 font-normal">/</span>
                        <span className="text-gray-500 font-medium">{t('permissions.permissions')}</span>
                      </>
                    )}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {filteredPermissions.length} {t('permissions.found')}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredPermissions.map((permission) => (
                    <Card key={permission.id} className="group hover:shadow-md transition-all duration-300 border-gray-200 bg-white">
                      <CardHeader className="pb-3 border-b border-gray-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {getPermissionTitle(permission)}
                            </CardTitle>
                         
                          </div>
                          {permission.action && (
                            <div className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                              getActionColor(permission.action)
                            )}>
                              {getActionLabel(permission.action)}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-600 leading-relaxed min-h-[40px]">
                          {getPermissionDescription(permission)}
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                          <div className="flex items-center gap-2">
                            <CustomIcon name="Monitor" className="h-3 w-3" />
                            <span>{getResourceLabel(permission.resource)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CustomIcon name="Calendar" className="h-3 w-3" iconType="lucide" />
                            <span>{new Date(permission.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CustomIcon name="Search" className="h-10 w-10 text-gray-300" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">{t('permissions.noPermissionsFound')}</h4>
                <p className="mt-2 text-gray-500 max-w-sm">
                  {search
                    ? t('permissions.adjustSearchCriteria')
                    : t('permissions.runSeedScript')}
                </p>
                {search && (
                  <Button
                    variant="link"
                    onClick={() => setSearch('')}
                    className="mt-4 text-blue-600"
                  >
                    {t('common.clear')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

