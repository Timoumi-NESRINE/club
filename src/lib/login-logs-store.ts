import fs from 'fs'
import path from 'path'

const BASE_DIR = path.join(process.cwd(), 'data', 'login-logs')

// Month names in French
const MONTHS_FR = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
]

interface LoginLog {
  id: string
  userId: string
  action: 'LOGIN' | 'LOGOUT'
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user?: {
    id: string
    email: string
    username: string
    firstName: string | null
    lastName: string | null
  }
}

interface LogsData {
  logs: LoginLog[]
}

// Get current year and month file path
function getCurrentLogPath(): { yearDir: string; monthFile: string } {
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = MONTHS_FR[now.getMonth()]
  
  const yearDir = path.join(BASE_DIR, year)
  const monthFile = path.join(yearDir, `${month}.json`)
  
  return { yearDir, monthFile }
}

// Get path for specific year/month
function getLogPath(year: string, month: string): { yearDir: string; monthFile: string } {
  const yearDir = path.join(BASE_DIR, year)
  const monthFile = path.join(yearDir, `${month}.json`)
  return { yearDir, monthFile }
}

// Ensure directory exists
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Read logs from a specific file
function readLogsFromFile(filePath: string): LogsData {
  if (!fs.existsSync(filePath)) {
    return { logs: [] }
  }
  const data = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(data)
}

// Write logs to a specific file
function writeLogsToFile(filePath: string, data: LogsData) {
  const dir = path.dirname(filePath)
  ensureDir(dir)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Get all available years
function getAvailableYears(): string[] {
  if (!fs.existsSync(BASE_DIR)) {
    return []
  }
  return fs.readdirSync(BASE_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort((a, b) => parseInt(b) - parseInt(a)) // Descending order
}

// Get all month files for a year
function getYearMonths(year: string): string[] {
  const yearDir = path.join(BASE_DIR, year)
  if (!fs.existsSync(yearDir)) {
    return []
  }
  return fs.readdirSync(yearDir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''))
}

export async function createLoginLog(data: {
  userId: string
  action: 'LOGIN' | 'LOGOUT'
  ipAddress: string | null
  userAgent: string | null
}) {
  const { yearDir, monthFile } = getCurrentLogPath()
  ensureDir(yearDir)
  
  const logsData = readLogsFromFile(monthFile)
  
  const newLog: LoginLog = {
    id: generateId(),
    userId: data.userId,
    action: data.action,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    createdAt: new Date().toISOString(),
  }
  
  logsData.logs.unshift(newLog) // Add to beginning (newest first)
  writeLogsToFile(monthFile, logsData)
  
  return newLog
}

export async function getLoginLogs(options: {
  page?: number
  limit?: number
  userId?: string
  action?: string
  year?: string
  month?: string
} = {}) {
  const { page = 1, limit = 50, userId, action, year, month } = options
  
  let allLogs: LoginLog[] = []
  
  if (year && month) {
    // Read specific month
    const { monthFile } = getLogPath(year, month)
    const logsData = readLogsFromFile(monthFile)
    allLogs = logsData.logs
  } else if (year) {
    // Read all months of a year
    const months = getYearMonths(year)
    for (const m of months) {
      const { monthFile } = getLogPath(year, m)
      const logsData = readLogsFromFile(monthFile)
      allLogs = allLogs.concat(logsData.logs)
    }
    // Sort by date descending
    allLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else {
    // Read all years (most recent first)
    const years = getAvailableYears()
    for (const y of years) {
      const months = getYearMonths(y)
      for (const m of months) {
        const { monthFile } = getLogPath(y, m)
        const logsData = readLogsFromFile(monthFile)
        allLogs = allLogs.concat(logsData.logs)
      }
    }
    // Sort by date descending
    allLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  
  // Filter
  if (userId) {
    allLogs = allLogs.filter(log => log.userId === userId)
  }
  if (action) {
    allLogs = allLogs.filter(log => log.action === action)
  }
  
  const total = allLogs.length
  const pages = Math.ceil(total / limit)
  const skip = (page - 1) * limit
  
  // Paginate
  const paginatedLogs = allLogs.slice(skip, skip + limit)
  
  return {
    logs: paginatedLogs,
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  }
}

export async function deleteAllLoginLogs() {
  if (fs.existsSync(BASE_DIR)) {
    fs.rmSync(BASE_DIR, { recursive: true, force: true })
  }
  return { message: 'All login logs deleted' }
}

// Get available years and months for UI
export async function getAvailablePeriods(): Promise<{ year: string; months: string[] }[]> {
  const years = getAvailableYears()
  return years.map(year => ({
    year,
    months: getYearMonths(year)
  }))
}
