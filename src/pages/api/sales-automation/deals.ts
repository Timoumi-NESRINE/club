import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const deals = await prisma.deal.findMany({
        include: { lead: true, creator: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(deals);
    }

    if (req.method === 'POST') {
      const deal = await prisma.deal.create({
        data: {
          ...req.body,
          value: req.body.value ? parseFloat(req.body.value) : null,
          probability: req.body.probability ? parseInt(req.body.probability) : null,
          expectedCloseDate: req.body.expectedCloseDate ? new Date(req.body.expectedCloseDate) : null
        }
      });
      return res.status(201).json(deal);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in deals API:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
