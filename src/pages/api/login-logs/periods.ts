import type { NextApiRequest, NextApiResponse } from 'next'
import { getAvailablePeriods } from '../../../lib/login-logs-store'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const periods = await getAvailablePeriods()
    const years = periods.map(p => p.year).sort((a, b) => parseInt(b) - parseInt(a))
    
    return res.status(200).json({ years })
  } catch (error) {
    console.error('Error fetching available periods:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
