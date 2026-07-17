import { useState, useEffect, useCallback } from 'react'
import { User } from '../../types'
import { ExactDataTable, Column, ViewAction, EditAction, DeleteAction } from '../ui/exact-data-table'
import { useToast } from '../ui/toast-compat'
import { useConfirmationDialog } from '../ui/confirmation-dialog'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface UserListProps {
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
  onAdd: () => void
}

export default function UserList({ onEdit, onDelete, onAdd }: UserListProps) {
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      })

      const response = await fetch(`/api/users?${params}`)
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch users:', data.error)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])


  const handleDeleteClick = (userId: string, userName: string) => {
    showConfirmation({
      title: t('users.deleteUser'),
      message: t('users.confirmDelete', { name: userName }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
      onConfirm: () => handleDelete(userId, userName)
    })
  }

  const handleDelete = async (userId: string, userName: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: t('users.deleteSuccess'),
          description: t('users.deleteSuccessDescription', { name: userName })
        })
        fetchUsers()
        onDelete(userId)
      } else {
        const data = await response.json()
        addToast({
          type: 'error',
          title: t('users.deleteError'),
          description: data.error
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      addToast({
        type: 'error',
        title: t('users.deleteError'),
        description: t('users.deleteErrorDescription')
      })
    }
  }

  // Définir les colonnes pour la DataTable selon l'image
  const columns: Column<User>[] = [
    {
      key: 'name',
      header: t('users.nameAndFirstname'),
      cell: (user) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 mr-3">
            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </div>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      key: 'email',
      header: t('users.email'),
      cell: (user) => (
        <div className="text-sm text-gray-900">{user.email}</div>
      ),
      sortable: true
    },
    {
      key: 'role',
      header: t('users.role'),
      cell: (user) => (
        <div className="text-sm text-gray-900">
          {user.userRoles?.[0]?.role?.name || 'employee'}
        </div>
      ),
      sortable: true
    },

    {
      key: 'status',
      header: t('users.status'),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      cell: (_) => (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          {t('users.active')}
        </span>
      ),
      sortable: true
    }
  ]

  const handleSearchSubmit = (query: string) => {
    setSearch(query)
    setPage(1)
  }

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    // Ici vous pouvez ajouter la logique de tri côté serveur
    console.log(`Sorting by ${column} in ${direction} order`)
    // Exemple : ajouter les paramètres de tri à fetchUsers
  }

  return (
    <div>
      <ExactDataTable
        data={users}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder={t('users.searchUsers')}
        onSearch={handleSearchSubmit}
        pagination={pagination}
        onPageChange={setPage}
        onSort={handleSort}
        title={t('admin.users')}
        subtitle={t('users.manageUsers')}
        addButtonText={t('users.addUser')}
        onAdd={onAdd}
        actions={(user: User) => (
          <>
            <ViewAction onClick={() => console.log('View user:', user.id)} />
            <EditAction onClick={() => onEdit(user)} />
            <DeleteAction onClick={() => handleDeleteClick(user.id, `${user.firstName} ${user.lastName}`)} />
          </>
        )}
        emptyMessage={t('users.noUsersFound')}
      />

      <ConfirmationDialog />
    </div>
  )
}
