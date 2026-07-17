import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import '../../../lib/init-database' // Initialize database on server startup
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

async function requireUserId(req: NextApiRequest, res: NextApiResponse): Promise<string | null> {
  const session = await getServerSession(req, res, authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  return userId
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getClients(req, res)
      case 'POST':
        return await createClient(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getClients(req: NextApiRequest, res: NextApiResponse) {
  const { page = '1', limit = '10', search } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const where = search
    ? {
        OR: [
          { nom: { contains: search as string, mode: 'insensitive' as const } },
          { prenom: { contains: search as string, mode: 'insensitive' as const } },
          { mail: { contains: search as string, mode: 'insensitive' as const } },
          { phone: { contains: search as string, mode: 'insensitive' as const } },
          { region: { contains: search as string, mode: 'insensitive' as const } },
          { pays: { contains: search as string, mode: 'insensitive' as const } },
          { codeAgence: { contains: search as string, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ])

  return res.status(200).json({
    clients,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  })
}

async function createClient(req: NextApiRequest, res: NextApiResponse) {
  const userId = await requireUserId(req, res)
  if (!userId) return

  const {
    nom,
    prenom,
    mail,
    phone,
    adresse,
    codePostal,
    region,
    pays,
    dateAdhesion,
    codeAgence,
  } = req.body

  if (!nom || !prenom || !mail || !dateAdhesion) {
    return res.status(400).json({ error: 'nom, prenom, mail, and dateAdhesion are required' })
  }

  const parsedDate = new Date(dateAdhesion)
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: 'dateAdhesion is invalid' })
  }

  const client = await prisma.client.create({
    data: {
      nom,
      prenom,
      mail,
      phone,
      adresse,
      codePostal,
      region,
      pays,
      dateAdhesion: parsedDate,
      codeAgence,
      createdById: userId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return res.status(201).json({ client })
}
