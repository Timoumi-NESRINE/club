import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Update lastActiveAt timestamp
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActiveAt: new Date() }
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error updating user activity:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
