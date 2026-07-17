import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// 3 months in milliseconds
const INACTIVITY_THRESHOLD = 90 * 24 * 60 * 60 * 1000

type UserData = {
  id: string
  email: string
  username: string
  lastActiveAt: Date | null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check for admin/scheduled job authorization
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const threeMonthsAgo = new Date(Date.now() - INACTIVITY_THRESHOLD)
    
    // Find users who haven't been active in 3 months and are still active
    // Use raw query to avoid TypeScript errors with new fields
    const inactiveUsers = await prisma.$queryRawUnsafe<UserData[]>(
      `SELECT id, email, username, lastActiveAt 
       FROM users 
       WHERE isActive = true 
       AND (lastActiveAt < '${threeMonthsAgo.toISOString()}'
       OR (lastActiveAt IS NULL AND createdAt < '${threeMonthsAgo.toISOString()}'))`
    )

    // Deactivate inactive accounts
    const deactivatedUsers = []
    for (const user of (inactiveUsers || [])) {
      // Update using raw query
      await prisma.$executeRawUnsafe(
        `UPDATE users 
         SET isActive = false, 
             deactivatedAt = '${new Date().toISOString()}',
             deactivationReason = 'INACTIVITY_3_MONTHS'
         WHERE id = '${user.id}'`
      )
      
      deactivatedUsers.push({
        id: user.id,
        email: user.email,
        username: user.username,
        lastActiveAt: user.lastActiveAt,
        deactivatedAt: new Date(),
        deactivationReason: 'INACTIVITY_3_MONTHS'
      })
    }

    return res.status(200).json({
      success: true,
      deactivatedCount: deactivatedUsers.length,
      deactivatedUsers
    })
  } catch (error) {
    console.error('Error deactivating inactive accounts:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
