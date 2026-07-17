import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Increase limits as base64 can be large
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
      idScanBase64
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

    const player = await prisma.player.create({
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
        status: 'PENDING'
      }
    })

    return res.status(201).json({ message: 'Inscription réussie', player })
  } catch (error: unknown) {
    console.error('Registration Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ message: 'Internal Server Error', error: errorMessage })
  }
}
