import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    if (req.method === 'PUT') {
      const campaign = await prisma.marketingCampaign.update({
        where: { id },
        data: {
          ...req.body,
          scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined
        }
      });
      return res.status(200).json(campaign);
    }

    if (req.method === 'DELETE') {
      await prisma.marketingCampaign.delete({ where: { id } });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in marketing API:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
