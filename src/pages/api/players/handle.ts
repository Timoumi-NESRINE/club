import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { playerId, action } = req.body

  if (!playerId || !action) {
    return res.status(400).json({ message: 'Missing playerId or action' })
  }

  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId }
    })

    if (!player) {
      return res.status(404).json({ message: 'Player not found' })
    }

    if (action === 'ACCEPT') {
      // 1. Update status
      await prisma.player.update({
        where: { id: playerId },
        data: { status: 'VALIDATED' }
      })

      // 2. See if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: player.email }
      })

      if (!existingUser) {
        // 3. Create User account and Role assignment in a transaction
        await prisma.$transaction(async (tx) => {
          const hashedPassword = await bcrypt.hash(player.licenseNumber, 10) // license as initial pass
          
          const newUser = await tx.user.create({
            data: {
              email: player.email,
              username: player.licenseNumber, // default username is license
              password: hashedPassword,
              firstName: player.firstName,
              lastName: player.lastName,
              isActive: true
            }
          })

          // 4. Assign "Joueur" role
          const joueurRole = await tx.role.findUnique({
            where: { name: 'Joueur' }
          })

          if (joueurRole) {
            await tx.userRole.create({
              data: {
                userId: newUser.id,
                roleId: joueurRole.id
              }
            })
          } else {
            console.warn('Role "Joueur" not found in database. User created without role.')
          }
        })
      }

      return res.status(200).json({ message: 'Joueur accepté et compte utilisateur créé.' })
    } 
    
    if (action === 'REJECT') {
      await prisma.player.update({
        where: { id: playerId },
        data: { status: 'REJECTED' }
      })
      return res.status(200).json({ message: 'Joueur refusé.' })
    }

    return res.status(400).json({ message: 'Invalid action' })

  } catch (error: unknown) {
    console.error('Accept Player Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ message: 'Internal Server Error', error: errorMessage })
  }
}
