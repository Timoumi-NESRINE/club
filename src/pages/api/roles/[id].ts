import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Role ID is required' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getRole(id, res)
      case 'PUT':
        return await updateRole(id, req, res)
      case 'DELETE':
        return await deleteRole(id, res)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getRole(id: string, res: NextApiResponse) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          userRoles: true,
          rolePermissions: true,
        },
      },
      userRoles: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
        },
      },
      rolePermissions: {
        include: {
          permission: {
            select: {
              id: true,
              name: true,
              description: true,
              resource: true,
              action: true,
            },
          },
        },
      },
    },
  })

  if (!role) {
    return res.status(404).json({ error: 'Role not found' })
  }

  return res.status(200).json({ role })
}

async function updateRole(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { name, description, isActive, permissionIds } = req.body

  // Check if role exists
  const existingRole = await prisma.role.findUnique({
    where: { id },
  })

  if (!existingRole) {
    return res.status(404).json({ error: 'Role not found' })
  }

  // Check for name conflicts (excluding current role)
  if (name && name !== existingRole.name) {
    const conflictRole = await prisma.role.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { name },
        ],
      },
    })

    if (conflictRole) {
      return res.status(409).json({ error: 'Role name already exists' })
    }
  }

  // Prepare update data
  const updateData: {
    name?: string;
    description?: string;
    isActive?: boolean;
    rolePermissions?: {
      create: Array<{
        permissionId: string;
      }>;
    };
  } = {}
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (isActive !== undefined) updateData.isActive = isActive

  // Handle permission updates
  if (permissionIds !== undefined) {
    // Delete existing permissions and create new ones
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    })

    if (permissionIds.length > 0) {
      updateData.rolePermissions = {
        create: permissionIds.map((permissionId: string) => ({
          permissionId,
        })),
      }
    }
  }

  const role = await prisma.role.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: {
          userRoles: true,
          rolePermissions: true,
        },
      },
      rolePermissions: {
        include: {
          permission: {
            select: {
              id: true,
              name: true,
              description: true,
              resource: true,
              action: true,
            },
          },
        },
      },
    },
  })

  return res.status(200).json({ role })
}

async function deleteRole(id: string, res: NextApiResponse) {
  // Check if role exists
  const existingRole = await prisma.role.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          userRoles: true,
        },
      },
    },
  })

  if (!existingRole) {
    return res.status(404).json({ error: 'Role not found' })
  }

  // Check if role is assigned to users
  if (existingRole._count.userRoles > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete role that is assigned to users. Please remove all user assignments first.' 
    })
  }

  // Delete role (cascade will handle related records)
  await prisma.role.delete({
    where: { id },
  })

  return res.status(200).json({ message: 'Role deleted successfully' })
}
