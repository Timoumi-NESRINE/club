import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import '../../../lib/init-database'

// Password policy validation
function validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' }
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one digit' }
  }
  return { valid: true }
}

// Calculate password expiration date (3 months from now)
function getPasswordExpirationDate(): Date {
  const date = new Date()
  date.setMonth(date.getMonth() + 3)
  return date
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getUsers(req, res)
      case 'POST':
        return await createUser(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  const { page = '1', limit = '10', search } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = search
    ? {
      OR: [
        { email: { contains: search as string, mode: 'insensitive' as const } },
        { username: { contains: search as string, mode: 'insensitive' as const } },
        { firstName: { contains: search as string, mode: 'insensitive' as const } },
        { lastName: { contains: search as string, mode: 'insensitive' as const } },
      ],
    }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ])

  return res.status(200).json({
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  })
}

async function createUser(req: NextApiRequest, res: NextApiResponse) {
  const { email, username, password, firstName, lastName, isActive, roleIds } = req.body

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' })
  }

  // Validate password policy
  const policyCheck = validatePasswordPolicy(password)
  if (!policyCheck.valid) {
    return res.status(400).json({ error: policyCheck.error })
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  })

  if (existingUser) {
    return res.status(409).json({ error: 'User with this email or username already exists' })
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user with roles and password expiration
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      isActive: isActive !== undefined ? isActive : true,
      passwordExpiresAt: getPasswordExpirationDate(),
      userRoles: roleIds?.length
        ? {
          create: roleIds.map((roleId: string) => ({
            roleId,
          })),
        }
        : undefined,
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      isActive: true,
      createdAt: true,
      userRoles: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  // Store password in history
  await prisma.passwordHistory.create({
    data: {
      userId: user.id,
      password: hashedPassword,
    },
  })

  return res.status(201).json({ user })
}
