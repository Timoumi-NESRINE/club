import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const sequences = await prisma.nurturingSequence.findMany({
        include: { lead: true, creator: true },
        orderBy: { scheduledFor: 'asc' }
      });
      return res.status(200).json(sequences);
    }

    if (req.method === 'POST') {
      const sequence = await prisma.nurturingSequence.create({
        data: {
          ...req.body,
          scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : null
        }
      });
      return res.status(201).json(sequence);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in nurturing API:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
