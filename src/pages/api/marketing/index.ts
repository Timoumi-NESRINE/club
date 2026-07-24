import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const campaigns = await prisma.marketingCampaign.findMany({
        include: { creator: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(campaigns);
    }

    if (req.method === 'POST') {
      const campaign = await prisma.marketingCampaign.create({
        data: {
          ...req.body,
          scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : null
        }
      });
      return res.status(201).json(campaign);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in marketing API:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
