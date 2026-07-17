import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {

  // Create permissions
  const permissions = [
    { name: 'users:create', description: 'Create users', resource: 'users', action: 'create' },
    { name: 'users:read', description: 'Read users', resource: 'users', action: 'read' },
    { name: 'users:update', description: 'Update users', resource: 'users', action: 'update' },
    { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
    { name: 'roles:create', description: 'Create roles', resource: 'roles', action: 'create' },
    { name: 'roles:read', description: 'Read roles', resource: 'roles', action: 'read' },
    { name: 'roles:update', description: 'Update roles', resource: 'roles', action: 'update' },
    { name: 'roles:delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
    { name: 'permissions:read', description: 'Read permissions', resource: 'permissions', action: 'read' },
    { name: 'clients:create', description: 'Create clients', resource: 'clients', action: 'create' },
    { name: 'clients:read', description: 'Read clients', resource: 'clients', action: 'read' },
    { name: 'clients:update', description: 'Update clients', resource: 'clients', action: 'update' },
    { name: 'clients:delete', description: 'Delete clients', resource: 'clients', action: 'delete' },
    { name: 'colors:read', description: 'Read colors', resource: 'colors', action: 'read' },
    { name: 'historyLogs:read', description: 'Read login history', resource: 'historyLogs', action: 'read' },
   
  ]

  const createdPermissions = await Promise.all(
    permissions.map(async (permission) => {
      return await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      })
    })
  )

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full system administrator with all permissions',
      isActive: true,
    },
  })

  const userRole = await prisma.role.upsert({
    where: { name: 'User' },
    update: {},
    create: {
      name: 'User',
      description: 'Standard user with limited permissions',
      isActive: true,
    },
  })

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Manager with user management permissions',
      isActive: true,
    },
  })

  // Assign all permissions to Admin role
  await Promise.all(
    createdPermissions.map(async (permission) => {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      })
    })
  )

  // Assign read permissions to User role
  const readPermissions = createdPermissions.filter(p => p.action === 'read')
  await Promise.all(
    readPermissions.map(async (permission) => {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: userRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      })
    })
  )

  // Assign user management permissions to Manager role
  const userPermissions = createdPermissions.filter(p => p.resource === 'users')
  await Promise.all(
    userPermissions.map(async (permission) => {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      })
    })
  )



  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      username: 'admin',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
    },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
    },
  })

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {
      username: 'manager',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Manager',
      isActive: true,
    },
    create: {
      email: 'manager@example.com',
      username: 'manager',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Manager',
      isActive: true,
    },
  })

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      username: 'user',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'User',
      isActive: true,
    },
    create: {
      email: 'user@example.com',
      username: 'user',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'User',
      isActive: true,
    },
  })

  // Assign roles to users
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: managerUser.id,
        roleId: managerRole.id,
      },
    },
    update: {},
    create: {
      userId: managerUser.id,
      roleId: managerRole.id,
    },
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: regularUser.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      userId: regularUser.id,
      roleId: userRole.id,
    },
  })



}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
