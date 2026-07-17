"use client"

import { ExactDataTable, Column, ViewAction, EditAction, DeleteAction } from './exact-data-table'

// Type pour les données de test
type TestUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  username: string
  userRoles: Array<{ role: { name: string } }>
}

// Données de test qui correspondent à l'image
const testUsers = [
  {
    id: '1',
    firstName: 'asma',
    lastName: 'hajamor',
    email: 'asmahajamor@gmail.com',
    username: '12345678',
    userRoles: [{ role: { name: 'employee' } }]
  },
  {
    id: '2',
    firstName: 'Next',
    lastName: 'Consult',
    email: 'superadmin@gmail.com',
    username: '10203050',
    userRoles: [{ role: { name: 'super_admin' } }]
  },
  {
    id: '3',
    firstName: 'Role',
    lastName: 'Test',
    email: 'RoleTest@gmail.com',
    username: '88888888',
    userRoles: [{ role: { name: 'roles test' } }]
  },
  {
    id: '4',
    firstName: 'Amine',
    lastName: '',
    email: 'Amine@gmail.com',
    username: '12345678',
    userRoles: [{ role: { name: 'employee' } }]
  },
  {
    id: '5',
    firstName: 'Nesrine',
    lastName: '',
    email: 'Nesrine@gmail.com',
    username: '88888888',
    userRoles: [{ role: { name: 'employee' } }]
  },
  {
    id: '6',
    firstName: 'test',
    lastName: 'test',
    email: 'a.hajamor@nest.tn',
    username: '41245252',
    userRoles: [{ role: { name: 'employee' } }]
  }
]

export function DataTableTest() {
  const columns: Column<TestUser>[] = [
    {
      key: 'name',
      header: 'Nom et Prénom',
      cell: (user) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 mr-3">
            {user.firstName?.charAt(0)?.toUpperCase()}{user.lastName?.charAt(0)?.toUpperCase()}
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
      header: 'Email',
      cell: (user) => (
        <div className="text-sm text-gray-900">{user.email}</div>
      ),
      sortable: true
    },
    {
      key: 'role',
      header: 'Rôle',
      cell: (user) => (
        <div className="text-sm text-gray-900">
          {user.userRoles?.[0]?.role?.name || 'employee'}
        </div>
      ),
      sortable: true
    },
    {
      key: 'department',
      header: 'Département',
      cell: () => (
        <div className="text-sm text-gray-900">Aucun département</div>
      ),
      sortable: true
    },
    {
      key: 'parent',
      header: 'Parent',
      cell: () => (
        <div className="text-sm text-gray-900">-</div>
      )
    },
    {
      key: 'cin',
      header: 'Cin',
      cell: (user) => (
        <div className="text-sm text-gray-900">{user.username}</div>
      ),
      sortable: true
    },
    {
      key: 'address',
      header: 'Adresse',
      cell: () => (
        <div className="text-sm text-gray-900">-</div>
      ),
      sortable: true
    },
    {
      key: 'telephone',
      header: 'Téléphone',
      cell: () => (
        <div className="text-sm text-gray-900">-</div>
      ),
      sortable: true
    },
    {
      key: 'permit',
      header: 'Permis',
      cell: () => (
        <div className="text-sm text-gray-900">-</div>
      ),
      sortable: true
    },
    {
      key: 'permitEndDate',
      header: 'Date de fin permis',
      cell: () => (
        <div className="text-sm text-gray-900">-</div>
      ),
      sortable: true
    },
    {
      key: 'status',
      header: 'Statut',
      cell: () => (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          actif
        </span>
      ),
      sortable: true
    }
  ]

  return (
    <div className="p-6">
      <ExactDataTable
        data={testUsers}
        columns={columns}
        searchable={true}
        searchPlaceholder="Rechercher des utilisateurs"
        title="Utilisateurs"
        subtitle="Gérer les utilisateurs"
        addButtonText="Ajouter un Utilisateur"
        onAdd={() => console.log('Add user')}
        pagination={{
          page: 1,
          limit: 10,
          total: 6,
          pages: 1
        }}
        actions={(user) => (
          <>
            <ViewAction onClick={() => console.log('View:', user.id)} />
            <EditAction onClick={() => console.log('Edit:', user.id)} />
            <DeleteAction onClick={() => console.log('Delete:', user.id)} />
          </>
        )}
      />
    </div>
  )
}
