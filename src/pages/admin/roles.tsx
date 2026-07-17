import { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import RoleList from '../../components/roles/RoleList'
import RoleForm from '../../components/roles/RoleForm'
import { ToastProvider } from '../../components/ui/toast-compat'
import { Role } from '../../types'

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setShowForm(true)
  }

  const handleAdd = () => {
    setSelectedRole(null)
    setShowForm(true)
  }

  const handleSave = () => {
    setShowForm(false)
    setSelectedRole(null)
    // The RoleList component will refresh automatically
  }

  const handleCancel = () => {
    setShowForm(false)
    setSelectedRole(null)
  }

  const handleDelete = (roleId: string) => {
    // The RoleList component handles the deletion
    console.log('Role deleted:', roleId)
  }

  return (
    <ToastProvider>
      <AdminLayout>
        <div className="py-6 px-6">
          <div>
            <RoleList
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          </div>
        </div>

        {showForm && (
          <RoleForm
            role={selectedRole}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </AdminLayout>
    </ToastProvider>
  )
}
