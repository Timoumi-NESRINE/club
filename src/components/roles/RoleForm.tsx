import { useState, useEffect } from 'react'
import { Role, Permission } from '../../types'
import { Modal, ModalFooter } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useToast } from '../ui/toast-compat'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Shield, Search, Key, Users, CheckCircle, XCircle } from 'lucide-react'

interface RoleFormProps {
  role?: Role | null
  onSave: (role: Role) => void
  onCancel: () => void
}

export default function RoleForm({ role, onSave, onCancel }: RoleFormProps) {
  const { addToast } = useToast()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    permissionIds: [] as string[],
  })
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [permissionSearch, setPermissionSearch] = useState('')
  const [isOpen, setIsOpen] = useState(true)

  const getResourceLabel = (resource?: string | null) => {
    const r = (resource || 'General').trim()
    const key = `permissions.resources.${r}`
    const translated = t(key)
    return translated && translated !== key ? translated : r
  }

  const getPermissionLabel = (permission: Permission) => {
    const permissionKey = (permission.name || '').trim().toLowerCase()
    const key = `permissions.names.${permissionKey}`
    const translated = t(key, { nsSeparator: false })
    return translated && translated !== key ? translated : permission.name
  }

  useEffect(() => {
    fetchPermissions()
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || '',
        isActive: role.isActive,
        permissionIds: role.rolePermissions?.map(rp => rp.permission.id) || [],
      })
    }
  }, [role])

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions?limit=100')
      const data = await response.json()
      if (response.ok) {
        setPermissions(data.permissions || [])
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const url = role ? `/api/roles/${role.id}` : '/api/roles'
      const method = role ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        addToast({
          type: 'success',
          title: role ? t('roles.updateSuccess') : t('roles.createSuccess'),
          description: role
            ? t('roles.updateSuccessDescription', { name: data.role.name })
            : t('roles.createSuccessDescription', { name: data.role.name })
        })
        onSave(data.role)
      } else {
        if (response.status === 400 || response.status === 409) {
          setErrors({ general: data.error })
          addToast({
            type: 'error',
            title: t('roles.saveError'),
            description: data.error
          })
        } else {
          const errorMsg = t('roles.saveErrorDescription')
          setErrors({ general: errorMsg })
          addToast({
            type: 'error',
            title: t('roles.saveError'),
            description: errorMsg
          })
        }
      }
    } catch (error) {
      console.error('Error saving role:', error)
      const errorMsg = t('roles.saveErrorDescription')
      setErrors({ general: errorMsg })
      addToast({
        type: 'error',
        title: t('roles.saveError'),
        description: errorMsg
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: checked
        ? [...prev.permissionIds, permissionId]
        : prev.permissionIds.filter(id => id !== permissionId),
    }))
  }

  // Filter and group permissions by resource with search
  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
    (permission.description || '').toLowerCase().includes(permissionSearch.toLowerCase()) ||
    (permission.resource || '').toLowerCase().includes(permissionSearch.toLowerCase())
  )

  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    const resource = getResourceLabel(permission.resource || 'General')
    if (!acc[resource]) {
      acc[resource] = []
    }
    acc[resource].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const selectedCount = formData.permissionIds.length
  const totalCount = permissions.length

  const handleClose = () => {
    setIsOpen(false)
    onCancel()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={role ? t('roles.editRole') : t('roles.addRole')}
      size="xl"
    >
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 -m-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {role ? t('roles.editRole') : t('roles.addRole')}
            </h3>
            <p className="text-sm text-gray-600">
              {role ? t('roles.editRoleDescription') : t('roles.createRoleDescription')}
            </p>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <div className="p-1 bg-red-100 rounded-lg">
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <span className="font-medium">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Informations de base */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Shield className="w-4 h-4" style={{ color: '#149fad' }} />
            </div>
            <h4 className="font-semibold text-gray-900">{t('roles.basicInfo')}</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('roles.name')} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-4 w-4" style={{ color: '#149fad' }} />
                </div>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-gray-900 bg-white/80 backdrop-blur-sm"
                  placeholder={t('roles.namePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('roles.description')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-gray-900 bg-white/80 backdrop-blur-sm resize-none"
                placeholder={t('roles.descriptionPlaceholder')}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" style={{ color: '#149fad' }} />
              <span className="text-sm font-medium text-gray-700">{t('roles.active')}</span>
            </div>
          </div>
        </div>

        {/* Section Permissions */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Key className="w-4 h-4" style={{ color: '#149fad' }} />
              </div>
              <h4 className="font-semibold text-gray-900">{t('roles.permissions')}</h4>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg">
              <Users className="w-4 h-4" style={{ color: '#149fad' }} />
              <span className="text-sm font-medium text-blue-800">
                {selectedCount}/{totalCount} {t('roles.selected')}
              </span>
            </div>
          </div>

          {/* Recherche des permissions */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#149fad' }} />
            <Input
              type="text"
              placeholder={t('roles.searchPermissions')}
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-gray-900"
            />
          </div>

          {/* Liste des permissions */}
          <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl bg-white">
            {Object.keys(groupedPermissions).length === 0 ? (
              <div className="p-8 text-center">
                <Key className="w-12 h-12 mx-auto mb-3" style={{ color: '#149fad' }} />
                <p className="text-sm text-gray-500">
                  {permissionSearch ? t('roles.noPermissionsFound') : t('roles.noPermissionsAvailable')}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                  <div key={resource} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-indigo-100 rounded-lg">
                        <Key className="w-3 h-3" style={{ color: '#149fad' }} />
                      </div>
                      <h5 className="font-semibold text-gray-900 text-sm">{resource}</h5>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {resourcePermissions.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 ml-6">
                      {resourcePermissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group border border-gray-100 hover:border-blue-200"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissionIds.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                                {getPermissionLabel(permission)}
                              </span>

                            </div>

                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="bg-[#149fad] hover:bg-[#117a85] text-white"
          >
            {role ? t('common.update') : t('common.create')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
