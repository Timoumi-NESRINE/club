import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const followUps = await prisma.followUp.findMany({
        include: { lead: true, creator: true },
        orderBy: { scheduledFor: 'asc' }
      });
      return res.status(200).json(followUps);
    }

    if (req.method === 'POST') {
      const followUp = await prisma.followUp.create({
        data: {
          ...req.body,
          scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : null
        }
      });
      return res.status(201).json(followUp);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in followups API:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
