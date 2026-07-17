import { useSession } from 'next-auth/react'

export function usePermissions() {
  const { data: session } = useSession()

  const hasRole = (roleName: string): boolean => {
    if (!session?.user?.roles) return false
    return session.user.roles.some(role => role.name === roleName)
  }

  const hasPermission = (permissionName: string): boolean => {
    if (!session?.user?.roles) return false
    
    return session.user.roles.some(role =>
      role.permissions.some(permission => permission.name === permissionName)
    )
  }

  const hasResourcePermission = (resource: string, action: string): boolean => {
    if (!session?.user?.roles) return false
    
    return session.user.roles.some(role =>
      role.permissions.some(permission => 
        permission.resource === resource && permission.action === action
      )
    )
  }

  const canAccessUsers = (): boolean => {
    return hasRole('Admin') || hasRole('Manager') || hasResourcePermission('users', 'read')
  }

  const canManageUsers = (): boolean => {
    return hasRole('Admin') || hasRole('Manager') || 
           (hasResourcePermission('users', 'create') && 
            hasResourcePermission('users', 'update') && 
            hasResourcePermission('users', 'delete'))
  }

  const canAccessRoles = (): boolean => {
    return hasRole('Admin') || hasResourcePermission('roles', 'read')
  }

  const canManageRoles = (): boolean => {
    return hasRole('Admin') || 
           (hasResourcePermission('roles', 'create') && 
            hasResourcePermission('roles', 'update') && 
            hasResourcePermission('roles', 'delete'))
  }

  const isAdmin = (): boolean => {
    return hasRole('Admin')
  }

  const isManager = (): boolean => {
    return hasRole('Manager')
  }



  const canAccessPermissions = (): boolean => {
    return hasRole('Admin') || hasResourcePermission('permissions', 'read')
  }

  return {
    hasRole,
    hasPermission,
    hasResourcePermission,
    canAccessUsers,
    canManageUsers,
    canAccessRoles,
    canManageRoles,
    canAccessPermissions,
    isAdmin,
    isManager,
    user: session?.user,
    isAuthenticated: !!session
  }
}
