import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    const {
      firstName,
      lastName,
      email,
      birthDate,
      licenseNumber,
      category,
      bloodGroup,
      height,
      weight,
      medicalCertBase64,
      idScanBase64,
      username,
      password
    } = req.body

    // Basic validation
    if (!firstName || !lastName || !email || !birthDate || !licenseNumber || !category || !bloodGroup) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Check if player with this email or license already exists
    const existingPlayer = await prisma.player.findFirst({
      where: {
        OR: [
          { licenseNumber },
          { email }
        ]
      }
    })

    if (existingPlayer) {
      return res.status(400).json({ message: 'Un joueur avec ce numéro de licence ou cet e-mail existe déjà.' })
    }

    // Check if user with this email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: username || licenseNumber }
        ]
      }
    })

    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet e-mail ou ce nom d\'utilisateur existe déjà.' })
    }

    // Helper function to save base64 to file
    const saveBase64File = (base64String: string, originalName: string, prefix: string) => {
      try {
        const matches = base64String.match(/^data:(.+);base64,(.+)$/)
        if (!matches || matches.length !== 3) return null
        
        const extension = matches[1].split('/')[1] || 'pdf'
        const base64Data = matches[2]
        const filename = `${prefix}_${licenseNumber}_${Date.now()}.${extension}`
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'players')
        
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }
        
        const filePath = path.join(uploadDir, filename)
        fs.writeFileSync(filePath, base64Data, 'base64')
        
        return `/uploads/players/${filename}`
      } catch (e) {
        console.error('Error saving file:', e)
        return null
      }
    }

    const medicalCertUrl = medicalCertBase64 ? saveBase64File(medicalCertBase64 as string, 'medical', 'cert') : null
    const idScanUrl = idScanBase64 ? saveBase64File(idScanBase64 as string, 'id', 'scan') : null

    // Create player and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Player with VALIDATED status
      const player = await tx.player.create({
        data: {
          firstName,
          lastName,
          email,
          birthDate: new Date(birthDate),
          licenseNumber,
          category,
          bloodGroup,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          medicalCertUrl,
          idScanUrl,
          status: 'VALIDATED' // Direct validation
        }
      })

      // 2. Create User account
      const hashedPassword = await bcrypt.hash(password || licenseNumber, 10)
      
      const newUser = await tx.user.create({
        data: {
          email: player.email,
          username: username || player.licenseNumber,
          password: hashedPassword,
          firstName: player.firstName,
          lastName: player.lastName,
          isActive: true
        }
      })

      // 3. Assign "Joueur" role
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

      return { player, user: newUser }
    })

    return res.status(201).json({ 
      message: 'Joueur créé et compte utilisateur validé avec succès', 
      player: result.player,
      user: result.user
    })
  } catch (error: unknown) {
    console.error('Direct Player Creation Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ message: 'Internal Server Error', error: errorMessage })
  }
}
