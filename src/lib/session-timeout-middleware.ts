import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../pages/api/auth/[...nextauth]'
import { prisma } from './prisma'

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000

type UserSessionData = {
  id: string
  isActive: boolean
  lastActiveAt: Date | null
  deactivatedAt: Date | null
  deactivationReason: string | null
}

export async function sessionTimeoutMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  // Skip for auth-related routes
  if (req.url?.includes('/api/auth/')) {
    return next()
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (session?.user?.id) {
      // Use raw query to avoid TypeScript errors with new fields
      const userResult = await prisma.$queryRawUnsafe<UserSessionData[]>(
        `SELECT id, isActive, lastActiveAt, deactivatedAt, deactivationReason 
         FROM users WHERE id = '${session.user.id}'`
      )

      if (!userResult || userResult.length === 0) {
        return res.status(401).json({ error: 'User not found' })
      }

      const user = userResult[0]

      // Check if account is deactivated
      if (!user.isActive) {
        return res.status(403).json({ 
          error: 'Account deactivated',
          reason: user.deactivationReason || 'Account inactive',
          deactivatedAt: user.deactivatedAt
        })
      }

      // Check session timeout (30 minutes of inactivity)
      if (user.lastActiveAt) {
        const lastActive = new Date(user.lastActiveAt).getTime()
        const now = Date.now()
        
        if (now - lastActive > SESSION_TIMEOUT) {
          // Session expired due to inactivity
          return res.status(440).json({ 
            error: 'Session expired',
            message: 'Session expired due to 30 minutes of inactivity',
            code: 'SESSION_TIMEOUT'
          })
        }
      }

      // Update last activity timestamp
      await prisma.user.update({
        where: { id: session.user.id },
        data: { lastActiveAt: new Date() }
      })
    }

    next()
  } catch (error) {
    console.error('Session timeout middleware error:', error)
    next()
  }
}
