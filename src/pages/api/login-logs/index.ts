import type { NextApiRequest, NextApiResponse } from 'next'
import { createLoginLog, getLoginLogs, deleteAllLoginLogs } from '../../../lib/login-logs-store'
import { prisma } from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getLogsHandler(req, res)
      case 'POST':
        return await createLogHandler(req, res)
      case 'DELETE':
        return await deleteLogsHandler(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getLogsHandler(req: NextApiRequest, res: NextApiResponse) {
  const { page = '1', limit = '50', userId, action, year, month } = req.query

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  
  const { logs, pagination } = await getLoginLogs({
    page: pageNum,
    limit: limitNum,
    userId: userId as string | undefined,
    action: action as string | undefined,
    year: year as string | undefined,
    month: month as string | undefined,
  })
  
  // Enrich with user data from database
  const userIds = [...new Set(logs.map(log => log.userId))]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  })
  
  const userMap = new Map(users.map(u => [u.id, u]))
  
  const enrichedLogs = logs.map(log => ({
    ...log,
    user: userMap.get(log.userId) || null,
  }))

  return res.status(200).json({
    logs: enrichedLogs,
    pagination,
  })
}

async function createLogHandler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, action, ipAddress, userAgent } = req.body

  if (!userId || !action) {
    return res.status(400).json({ error: 'userId and action are required' })
  }

  if (!['LOGIN', 'LOGOUT'].includes(action)) {
    return res.status(400).json({ error: 'action must be LOGIN or LOGOUT' })
  }

  const log = await createLoginLog({
    userId,
    action,
    ipAddress: ipAddress || req.headers['x-forwarded-for'] || req.socket.remoteAddress as string,
    userAgent: userAgent || req.headers['user-agent'] as string,
  })

  // Get user data for response
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  })

  return res.status(201).json({ log: { ...log, user } })
}

async function deleteLogsHandler(req: NextApiRequest, res: NextApiResponse) {
  const result = await deleteAllLoginLogs()
  return res.status(200).json(result)
}
