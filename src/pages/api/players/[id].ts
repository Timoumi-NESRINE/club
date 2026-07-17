import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid player ID' })
  }

  try {
    const player = await prisma.player.findUnique({
      where: { id }
    })

    if (!player) {
      return res.status(404).json({ message: 'Player not found' })
    }

    return res.status(200).json(player)
  } catch (error: unknown) {
    console.error('Get Player Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ message: 'Internal Server Error', error: errorMessage })
  }
}
