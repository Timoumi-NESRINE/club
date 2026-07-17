import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    const players = await prisma.player.findMany({
      orderBy: { createdAt: 'desc' },
      // You might want to filter by PENDING here by default but let's return all and filter UI
    })
    return res.status(200).json(players)
  } catch (error: unknown) {
    console.error('List Players Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ message: 'Internal Server Error', error: errorMessage })
  }
}
