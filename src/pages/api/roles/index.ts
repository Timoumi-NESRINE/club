import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getRoles(req, res)
      case 'POST':
        return await createRole(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getRoles(req: NextApiRequest, res: NextApiResponse) {
  const { page = '1', limit = '10', search, includeUsers } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = search
    ? {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' as const } },
          { description: { contains: search as string, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const include = {
    _count: {
      select: {
        userRoles: true,
        rolePermissions: true,
      },
    },
    ...(includeUsers === 'true' && {
      userRoles: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    }),
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
  }

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      skip,
      take: limitNum,
      include,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.role.count({ where }),
  ])

  return res.status(200).json({
    roles,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  })
}

async function createRole(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, permissionIds } = req.body

  if (!name) {
    return res.status(400).json({ error: 'Role name is required' })
  }

  // Check if role already exists
  const existingRole = await prisma.role.findUnique({
    where: { name },
  })

  if (existingRole) {
    return res.status(409).json({ error: 'Role with this name already exists' })
  }

  // Create role with permissions
  const role = await prisma.role.create({
    data: {
      name,
      description,
      rolePermissions: permissionIds?.length
        ? {
            create: permissionIds.map((permissionId: string) => ({
              permissionId,
            })),
          }
        : undefined,
    },
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

  return res.status(201).json({ role })
}
