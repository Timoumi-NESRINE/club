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
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Client ID is required' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getClient(id, res)
      case 'PUT':
        return await updateClient(id, req, res)
      case 'DELETE':
        return await deleteClient(id, req, res)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getClient(id: string, res: NextApiResponse) {
  const client = await prisma.client.findUnique({
    where: { id },
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

  if (!client) {
    return res.status(404).json({ error: 'Client not found' })
  }

  return res.status(200).json({ client })
}

async function updateClient(id: string, req: NextApiRequest, res: NextApiResponse) {
  const userId = await requireUserId(req, res)
  if (!userId) return

  const existingClient = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      createdById: true,
    },
  })

  if (!existingClient) {
    return res.status(404).json({ error: 'Client not found' })
  }

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

  const updateData: {
    nom?: string;
    prenom?: string;
    mail?: string;
    phone?: string | null;
    adresse?: string | null;
    codePostal?: string | null;
    region?: string | null;
    pays?: string | null;
    dateAdhesion?: Date;
    codeAgence?: string | null;
  } = {}

  if (nom !== undefined) updateData.nom = nom
  if (prenom !== undefined) updateData.prenom = prenom
  if (mail !== undefined) updateData.mail = mail
  if (phone !== undefined) updateData.phone = phone
  if (adresse !== undefined) updateData.adresse = adresse
  if (codePostal !== undefined) updateData.codePostal = codePostal
  if (region !== undefined) updateData.region = region
  if (pays !== undefined) updateData.pays = pays
  if (codeAgence !== undefined) updateData.codeAgence = codeAgence

  if (dateAdhesion !== undefined) {
    const parsedDate = new Date(dateAdhesion)
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'dateAdhesion is invalid' })
    }
    updateData.dateAdhesion = parsedDate
  }

  const client = await prisma.client.update({
    where: { id },
    data: updateData,
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

  return res.status(200).json({ client })
}

async function deleteClient(id: string, req: NextApiRequest, res: NextApiResponse) {
  const userId = await requireUserId(req, res)
  if (!userId) return

  const existingClient = await prisma.client.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existingClient) {
    return res.status(404).json({ error: 'Client not found' })
  }

  await prisma.client.delete({
    where: { id },
  })

  return res.status(200).json({ message: 'Client deleted successfully' })
}
