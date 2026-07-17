// Permissions constants
export const PERMISSIONS = {
  // Users permissions
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Roles permissions
  ROLES_CREATE: 'roles:create',
  ROLES_READ: 'roles:read',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  
  // Permissions permissions
  PERMISSIONS_READ: 'permissions:read',
  
  // Clients permissions
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_READ: 'clients:read',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',

  // Colors permissions
  COLORS_READ: 'colors:read',
  // History Logs permissions
  HISTORY_LOGS_READ: 'historyLogs:read',


} as const;

// Roles configuration
export const ROLES = {
  ADMIN: {
    name: 'Admin',
    description: 'Full system administrator with all permissions',
    nameparent: null,
    permissions: Object.values(PERMISSIONS)
  },
  USER: {
    name: 'User',
    description: 'Standard user with limited permissions',
    nameparent: 'Admin',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.PERMISSIONS_READ,
     
    ]
  },
  MANAGER: {
    name: 'Manager',
    description: 'Manager with user management permissions',
    nameparent: 'Admin',
    permissions: [
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_DELETE,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.PERMISSIONS_READ,
    ]
  }
} as const;
