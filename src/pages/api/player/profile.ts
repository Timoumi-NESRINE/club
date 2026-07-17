import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../auth/[...nextauth]'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Find player associated with the logged-in user
    const player = await prisma.player.findUnique({
      where: { email: session.user.email }
    })

    if (!player) {
      return res.status(404).json({ message: 'Player not found' })
    }

    return res.status(200).json(player)
  } catch (error: unknown) {
    console.error('Get Player Profile Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ message: 'Internal Server Error', error: errorMessage })
  }
}
