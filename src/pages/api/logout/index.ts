import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { createLoginLog } from '../../../lib/login-logs-store'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user token
    const token = await getToken({ req })
    
    if (token?.id) {
      // Log logout with IP and User-Agent
      const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || null
      const userAgent = req.headers['user-agent'] || null
      
      await createLoginLog({
        userId: token.id as string,
        action: 'LOGOUT',
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress as string | null,
        userAgent: userAgent as string | null,
      })
    }

    return res.status(200).json({ message: 'Logout logged successfully' })
  } catch (error) {
    console.error('Logout log error:', error)
    return res.status(500).json({ error: 'Failed to log logout' })
  }
}
