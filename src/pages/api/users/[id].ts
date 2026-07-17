import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

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

// Check if password was previously used
async function isPasswordReused(userId: string, newPassword: string): Promise<boolean> {
  // Get last 5 password history entries
  const passwordHistory = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Check if new password matches any previous password
  for (const entry of passwordHistory) {
    const isMatch = await bcrypt.compare(newPassword, entry.password)
    if (isMatch) {
      return true
    }
  }
  return false
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getUser(id, res)
      case 'PUT':
        return await updateUser(id, req, res)
      case 'DELETE':
        return await deleteUser(id, res)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getUser(id: string, res: NextApiResponse) {
  const user = await prisma.user.findUnique({
    where: { id },
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
              description: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  return res.status(200).json({ user })
}

async function updateUser(id: string, req: NextApiRequest, res: NextApiResponse) {
  const { email, username, password, firstName, lastName, isActive, roleIds } = req.body

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  })

  if (!existingUser) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Check for email/username conflicts (excluding current user)
  if (email || username) {
    const conflictUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              email ? { email } : {},
              username ? { username } : {},
            ].filter(Boolean),
          },
        ],
      },
    })

    if (conflictUser) {
      return res.status(409).json({ error: 'Email or username already exists' })
    }
  }

  // Prepare update data
  const updateData: {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
    password?: string;
    passwordExpiresAt?: Date;
    userRoles?: {
      create: Array<{
        roleId: string;
      }>;
    };
  } = {}
  if (email !== undefined) updateData.email = email
  if (username !== undefined) updateData.username = username
  if (firstName !== undefined) updateData.firstName = firstName
  if (lastName !== undefined) updateData.lastName = lastName
  if (isActive !== undefined) updateData.isActive = isActive
  if (password) {
    // Validate password policy
    const policyCheck = validatePasswordPolicy(password)
    if (!policyCheck.valid) {
      return res.status(400).json({ error: policyCheck.error })
    }

    // Check if password was previously used
    const isReused = await isPasswordReused(id, password)
    if (isReused) {
      return res.status(400).json({ error: 'Cannot reuse a previous password' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    updateData.password = hashedPassword
    updateData.passwordExpiresAt = getPasswordExpirationDate()

    // Store new password in history
    await prisma.passwordHistory.create({
      data: {
        userId: id,
        password: hashedPassword,
      },
    })

    // Clean up old password history (keep only last 5)
    const historyCount = await prisma.passwordHistory.count({
      where: { userId: id },
    })
    if (historyCount > 5) {
      const oldEntries = await prisma.passwordHistory.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        skip: 5,
      })
      for (const entry of oldEntries) {
        await prisma.passwordHistory.delete({
          where: { id: entry.id },
        })
      }
    }
  }

  // Handle role updates
  if (roleIds !== undefined) {
    // Delete existing roles and create new ones
    await prisma.userRole.deleteMany({
      where: { userId: id },
    })

    if (roleIds.length > 0) {
      updateData.userRoles = {
        create: roleIds.map((roleId: string) => ({
          roleId,
        })),
      }
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
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
  })

  return res.status(200).json({ user })
}

async function deleteUser(id: string, res: NextApiResponse) {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  })

  if (!existingUser) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Delete user (cascade will handle related records)
  await prisma.user.delete({
    where: { id },
  })

  return res.status(200).json({ message: 'User deleted successfully' })
}
