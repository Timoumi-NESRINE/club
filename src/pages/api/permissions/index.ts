import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getPermissions(req, res)
      case 'POST':
        return await createPermission(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getPermissions(req: NextApiRequest, res: NextApiResponse) {
  const { page = '1', limit = '10', search, resource } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where: {
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' };
      description?: { contains: string; mode: 'insensitive' };
      resource?: { contains: string; mode: 'insensitive' };
      action?: { contains: string; mode: 'insensitive' };
    }>;
    resource?: string;
  } = {}
  
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
      { resource: { contains: search as string, mode: 'insensitive' } },
      { action: { contains: search as string, mode: 'insensitive' } },
    ]
  }

  if (resource) {
    where.resource = Array.isArray(resource) ? resource[0] : resource
  }

  const [permissions, total] = await Promise.all([
    prisma.permission.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
        { name: 'asc' },
      ],
    }),
    prisma.permission.count({ where }),
  ])

  return res.status(200).json({
    permissions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  })
}

async function createPermission(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, resource, action } = req.body

  if (!name) {
    return res.status(400).json({ error: 'Permission name is required' })
  }

  // Check if permission already exists
  const existingPermission = await prisma.permission.findUnique({
    where: { name },
  })

  if (existingPermission) {
    return res.status(409).json({ error: 'Permission with this name already exists' })
  }

  const permission = await prisma.permission.create({
    data: {
      name,
      description,
      resource,
      action,
    },
    include: {
      _count: {
        select: {
          rolePermissions: true,
        },
      },
    },
  })

  return res.status(201).json({ permission })
}
