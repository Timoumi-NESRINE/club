export interface User {
  id: string
  email: string
  username: string
  firstName?: string | null
  lastName?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  userRoles?: UserRole[]
}

export interface Role {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  userRoles?: UserRole[]
  rolePermissions?: RolePermission[]
  _count?: {
    userRoles: number
    rolePermissions: number
  }
}

export interface Permission {
  id: string
  name: string
  description?: string | null
  resource?: string | null
  action?: string | null
  createdAt: string
  updatedAt: string
  rolePermissions?: RolePermission[]
}



export interface UserRole {
  id: string
  userId: string
  roleId: string
  assignedAt: string
  assignedBy?: string | null
  user: User
  role: Role
}

export interface RolePermission {
  id: string
  roleId: string
  permissionId: string
  grantedAt: string
  grantedBy?: string | null
  role: Role
  permission: Permission
}

export interface Client {
  id: string
  nom: string
  prenom: string
  mail: string
  phone?: string | null
  adresse?: string | null
  codePostal?: string | null
  region?: string | null
  pays?: string | null
  dateAdhesion: string
  codeAgence?: string | null
  createdById: string
  createdBy?: User
  createdAt: string
  updatedAt: string
}



export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}
