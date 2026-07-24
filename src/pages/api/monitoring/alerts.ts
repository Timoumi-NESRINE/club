import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const alerts = await prisma.systemAlert.findMany({
        include: { resolver: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(alerts);
    }

    if (req.method === 'POST') {
      const alert = await prisma.systemAlert.create({
        data: {
          ...req.body,
          metadata: req.body.metadata ? JSON.parse(req.body.metadata) : null
        }
      });
      return res.status(201).json(alert);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in alerts API:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
