import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { DataTableUser } from '../../components/users/DataTableUser'
import UserForm from '../../components/users/UserForm'
import { ToastProvider } from '../../components/ui/toast-compat'
import { Button } from '../../components/ui/button'
import { User } from '../../types'
import { useTranslation } from '@/lib/hooks/useTranslation'
import CustomIcon from '@/components/ui/CustomIcon'
import { useColors } from '@/contexts/ColorContext'

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()
  useColors() // Keep hook call for side effects

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setShowForm(true)
  }

  const handleAdd = () => {
    setSelectedUser(null)
    setShowForm(true)
  }

  const handleSave = () => {
    setShowForm(false)
    setSelectedUser(null)
    // Refresh the users list after save
    fetchUsers()
  }

  const handleCancel = () => {
    setShowForm(false)
    setSelectedUser(null)
  }

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users || data)
      } else {
        console.error('Failed to fetch users:', data.error)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh the users list
        fetchUsers()
      } else {
        console.error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !user.isActive
        }),
      })

      if (response.ok) {
        // Refresh the users list
        fetchUsers()
      } else {
        console.error('Failed to toggle user active state')
      }
    } catch (error) {
      console.error('Error toggling user active state:', error)
    }
  }

  return (
    <ToastProvider>
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="py-4 px-4 sm:py-8 sm:px-6">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">

                </div>

                <div className="flex items-center gap-3">

                  <Button
                    onClick={handleAdd}
                    className="bg-[#149fad] hover:bg-[#117a85] text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <CustomIcon name="Like" className="w-4 h-4 mr-2 text-white" iconType="custom" />
                    {t('users.addUser')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">{t('users.totalUsers')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-[#149fad]/10 rounded-xl w-fit">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#149fad]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">{t('users.activeUsers')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-xl w-fit">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">{t('users.inactiveUsers')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">{users.filter(u => !u.isActive).length}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-red-100 rounded-xl w-fit">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <DataTableUser
              users={users}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              isLoading={loading}
            />
          </div>

          <UserForm
            user={selectedUser}
            isOpen={showForm}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </AdminLayout>
    </ToastProvider>
  )
}
