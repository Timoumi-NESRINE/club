import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [
      totalLeads,
      qualifiedLeads,
      totalDeals,
      wonDeals,
      activeCampaigns,
      pendingFollowUps,
      openAlerts
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'QUALIFIED' } }),
      prisma.deal.count(),
      prisma.deal.count({ where: { stage: 'WON' } }),
      prisma.marketingCampaign.count({ where: { status: 'PUBLISHED' } }),
      prisma.followUp.count({ where: { status: 'PENDING' } }),
      prisma.systemAlert.count({ where: { status: 'OPEN' } })
    ]);

    const conversionRate = totalLeads > 0 ? (wonDeals / totalLeads) * 100 : 0;

    const recentLeads = await prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { assignedToUser: true }
    });

    const recentDeals = await prisma.deal.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { lead: true, creator: true }
    });

    const recentAlerts = await prisma.systemAlert.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { status: 'OPEN' }
    });

    res.status(200).json({
      kpis: {
        totalLeads,
        qualifiedLeads,
        conversionRate,
        totalDeals,
        wonDeals,
        activeCampaigns,
        pendingFollowUps,
        openAlerts
      },
      recentLeads,
      recentDeals,
      recentAlerts
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}
