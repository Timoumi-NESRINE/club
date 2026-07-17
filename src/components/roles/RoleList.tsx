import { useState, useEffect, useCallback } from 'react'
import { Role } from '../../types'
import { DataTableRole } from './DataTableRole'
import { Button } from '../ui/button'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Shield } from 'lucide-react'

interface RoleListProps {
  onEdit: (role: Role) => void
  onDelete: (roleId: string) => void
  onAdd: () => void
}

export default function RoleList({ onEdit, onDelete, onAdd }: RoleListProps) {
  const { t } = useTranslation()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/roles?includeUsers=true')
      const data = await response.json()

      if (response.ok) {
        setRoles(data.roles || data)
      } else {
        console.error('Failed to fetch roles:', data.error)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleDelete = async (roleId: string) => {
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh the roles list
        fetchRoles()
        onDelete(roleId)
      } else {
        console.error('Failed to delete role')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="py-8 px-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              {/* Header content can be added here */}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={onAdd}
                className="bg-[#149fad] hover:bg-[#117a85] text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Shield className="w-4 h-4 mr-2 text-white" />
                {t('roles.addRole')}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('roles.totalRoles')}</p>
                <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
              </div>
              <div className="p-3 bg-[#149fad]/10 rounded-xl">
                <Shield className="w-6 h-6 text-[#149fad]" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('roles.activeRoles')}</p>
                <p className="text-2xl font-bold text-green-600">{roles.filter(r => r.isActive).length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('roles.inactiveRoles')}</p>
                <p className="text-2xl font-bold text-red-600">{roles.filter(r => !r.isActive).length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTableRole
          roles={roles}
          onEdit={onEdit}
          onDelete={handleDelete}
          isLoading={loading}
        />
      </div>
    </div>
  )
}
