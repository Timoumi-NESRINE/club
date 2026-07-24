import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const leads = await prisma.lead.findMany({
        include: { assignedToUser: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(leads);
    }

    if (req.method === 'POST') {
      const lead = await prisma.lead.create({
        data: req.body
      });
      return res.status(201).json(lead);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in leads API:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
