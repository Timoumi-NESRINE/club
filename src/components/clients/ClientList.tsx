import { useCallback, useEffect, useState } from 'react'
import { Client } from '../../types'
import { ExactDataTable, Column, EditAction, DeleteAction, ViewAction } from '../ui/exact-data-table'
import { useToast } from '../ui/toast-compat'
import { useConfirmationDialog } from '../ui/confirmation-dialog'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface ClientListProps {
  onEdit: (client: Client) => void
  onDelete: (clientId: string) => void
  onAdd: () => void
}

export default function ClientList({ onEdit, onDelete, onAdd }: ClientListProps) {
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog()
  // ... rest of state ...
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      })

      const response = await fetch(`/api/clients?${params}`)
      const data = await response.json()

      if (response.ok) {
        setClients(data.clients)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch clients:', data.error)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleSearchSubmit = (query: string) => {
    setSearch(query)
    setPage(1)
  }

  const handleDeleteClick = (client: Client) => {
    showConfirmation({
      title: t('clients.confirmDelete'),
      message: t('clients.confirmDeleteMessage', { name: `${client.prenom} ${client.nom}` }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'destructive',
      onConfirm: () => handleDelete(client),
    })
  }

  const handleDelete = async (client: Client) => {
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: t('clients.deleteSuccess'),
          description: `${client.prenom} ${client.nom}`,
        })
        fetchClients()
        onDelete(client.id)
      } else {
        const data = await response.json()
        addToast({
          type: 'error',
          title: t('common.error'),
          description: data.error,
        })
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      addToast({
        type: 'error',
        title: t('common.error'),
        description: t('messages.operationFailed'),
      })
    }
  }

  const columns: Column<Client>[] = [
    {
      key: 'nom',
      header: t('clients.nameAndFirstname'),
      cell: (c) => (
        <div className="text-sm font-medium text-gray-900">
          {c.prenom} {c.nom}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'mail',
      header: t('clients.email'),
      cell: (c) => <div className="text-sm text-gray-900">{c.mail}</div>,
      sortable: true,
    },
    {
      key: 'phone',
      header: t('clients.phone'),
      cell: (c) => <div className="text-sm text-gray-900">{c.phone || '-'}</div>,
      sortable: false,
    },
    {
      key: 'region',
      header: t('clients.region'),
      cell: (c) => <div className="text-sm text-gray-900">{c.region || '-'}</div>,
      sortable: false,
    },
    {
      key: 'pays',
      header: t('clients.country'),
      cell: (c) => <div className="text-sm text-gray-900">{c.pays || '-'}</div>,
      sortable: false,
    },
    {
      key: 'dateAdhesion',
      header: t('clients.membership'),
      cell: (c) => (
        <div className="text-sm text-gray-900">
          {c.dateAdhesion ? new Date(c.dateAdhesion).toLocaleDateString(t('common.page') === 'page' ? 'en-US' : 'fr-FR') : '-'}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'codeAgence',
      header: t('clients.agencyCode'),
      cell: (c) => <div className="text-sm text-gray-900">{c.codeAgence || '-'}</div>,
      sortable: false,
    },
  ]

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    console.log(`Sorting by ${column} in ${direction} order`)
  }

  return (
    <div>
      <ExactDataTable
        data={clients}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder={t('clients.searchPlaceholder')}
        onSearch={handleSearchSubmit}
        pagination={pagination}
        onPageChange={setPage}
        onSort={handleSort}
        title={t('clients.title')}
        subtitle={t('clients.manageClients')}
        addButtonText={t('clients.addClient')}
        onAdd={onAdd}
        actions={(c: Client) => (
          <>
            <ViewAction onClick={() => console.log('View client:', c.id)} />
            <EditAction onClick={() => onEdit(c)} />
            <DeleteAction onClick={() => handleDeleteClick(c)} />
          </>
        )}
        emptyMessage={t('clients.noClients')}
      />

      <ConfirmationDialog />
    </div>
  )
}
