import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    if (req.method === 'PUT') {
      const alert = await prisma.systemAlert.update({
        where: { id },
        data: req.body
      });
      return res.status(200).json(alert);
    }

    if (req.method === 'DELETE') {
      await prisma.systemAlert.delete({ where: { id } });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in alert API:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
