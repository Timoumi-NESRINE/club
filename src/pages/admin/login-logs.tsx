import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { ToastProvider } from '../../components/ui/toast-compat'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  LogIn,
  LogOut,
  Calendar,
  Monitor,
  RotateCcw,
  ArrowUpDown,
  User as UserIcon,
  History,
} from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import CustomIcon from '@/components/ui/CustomIcon'
import { Tooltip } from "@/components/ui/tooltip"
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface LoginLog {
  id: string
  userId: string
  action: 'LOGIN' | 'LOGOUT'
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: {
    id: string
    email: string
    username: string
    firstName: string | null
    lastName: string | null
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function LoginLogsPage() {
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<'ALL' | 'LOGIN' | 'LOGOUT'>('ALL')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  
  // Year and month filters - default to current
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear().toString()
  const MONTHS_FR = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre']
  const currentMonth = MONTHS_FR[currentDate.getMonth()]
  
  const [yearFilter, setYearFilter] = useState<string>(currentYear)
  const [monthFilter, setMonthFilter] = useState<string>(currentMonth)
  const [availableYears, setAvailableYears] = useState<string[]>([currentYear])
  const [availableMonths] = useState<string[]>(MONTHS_FR)
  
  const { t } = useTranslation()
  const { ConfirmationDialog } = useConfirmationDialog()

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        year: yearFilter,
        month: monthFilter,
      })
      if (actionFilter !== 'ALL') {
        params.append('action', actionFilter)
      }

      const response = await fetch(`/api/login-logs?${params}`)
      const data = await response.json()

      if (response.ok) {
        setLogs(data.logs)
        setPagination(data.pagination)
        // Update available years from response if provided
        if (data.availableYears) {
          setAvailableYears(data.availableYears)
        }
      } else {
        console.error('Failed to fetch login logs:', data.error)
      }
    } catch (error) {
      console.error('Error fetching login logs:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, actionFilter, yearFilter, monthFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])
  
  // Fetch available years on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch('/api/login-logs/periods')
        if (response.ok) {
          const data = await response.json()
          if (data.years && data.years.length > 0) {
            setAvailableYears(data.years)
          }
        }
      } catch (error) {
        console.error('Error fetching available years:', error)
      }
    }
    fetchYears()
  }, [])

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getUserDisplayName = (user: LoginLog['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.username || user.email
  }

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase()
    const userName = getUserDisplayName(log.user).toLowerCase()
    const userEmail = log.user.email.toLowerCase()
    return userName.includes(searchLower) || userEmail.includes(searchLower)
  })

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (!sortColumn) return 0
    const dir = sortDirection === 'desc' ? -1 : 1
    if (sortColumn === 'user') {
      const nameA = getUserDisplayName(a.user)
      const nameB = getUserDisplayName(b.user)
      return nameA.localeCompare(nameB) * dir
    }
    if (sortColumn === 'action') return a.action.localeCompare(b.action) * dir
    if (sortColumn === 'ip') return (a.ipAddress || '').localeCompare(b.ipAddress || '') * dir
    if (sortColumn === 'date') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
    return 0
  })

  const getActionIcon = (action: string) => {
    if (action === 'LOGIN') {
      return <LogIn className="h-4 w-4 text-green-600" />
    }
    return <LogOut className="h-4 w-4 text-red-600" />
  }

  const getActionBadge = (action: string) => {
    if (action === 'LOGIN') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {getActionIcon(action)}
          <span className="ml-1">{t('loginLogs.login')}</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        {getActionIcon(action)}
        <span className="ml-1">{t('loginLogs.logout')}</span>
      </span>
    )
  }

  return (
    <ToastProvider>
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="py-4 px-4 sm:py-8 sm:px-6">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">

                </div>

              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">{t('loginLogs.totalConnections')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{pagination.total}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-[#149fad]/10 rounded-xl w-fit">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#149fad]" />
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">{t('loginLogs.logins')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {logs.filter(l => l.action === 'LOGIN').length}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-xl w-fit">
                    <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">{t('loginLogs.logouts')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">
                      {logs.filter(l => l.action === 'LOGOUT').length}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-red-100 rounded-xl w-fit">
                    <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <Card className="bg-white border-gray-200 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#149fad] rounded-xl shadow-lg">
                      <History className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{t('loginLogs.title')}</h3>
                      <p className="text-sm text-gray-600">{t('loginLogs.subtitle')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center w-full lg:w-80">
                      <Search className="absolute left-7 h-5 w-5 text-[#149fad] pointer-events-none z-10" />
                      <Input
                        placeholder={t('loginLogs.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-14 pr-4 py-2 w-full bg-white border-gray-300 rounded-xl shadow-md focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <Button
                      onClick={() => fetchLogs()}
                      className="bg-[#149fad] hover:bg-[#117a85] text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-3 mt-4 items-center">
                  {/* Year Filter */}
                  <div className="relative">
                    <select
                      value={yearFilter}
                      onChange={(e) => {
                        setYearFilter(e.target.value)
                        setPagination(prev => ({ ...prev, page: 1 }))
                      }}
                      className="appearance-none px-4 py-2.5 pr-10 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-[#149fad] hover:text-[#149fad] focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] outline-none transition-all duration-200 cursor-pointer shadow-sm"
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#149fad] pointer-events-none" />
                  </div>
                  
                  {/* Month Filter */}
                  <div className="relative">
                    <select
                      value={monthFilter}
                      onChange={(e) => {
                        setMonthFilter(e.target.value)
                        setPagination(prev => ({ ...prev, page: 1 }))
                      }}
                      className="appearance-none px-4 py-2.5 pr-10 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-[#149fad] hover:text-[#149fad] focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] outline-none transition-all duration-200 cursor-pointer shadow-sm capitalize"
                    >
                      {availableMonths.map(month => (
                        <option key={month} value={month} className="capitalize">{month}</option>
                      ))}
                    </select>
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#149fad] pointer-events-none" />
                  </div>
                  
                  <div className="w-px h-8 bg-gray-300 mx-2" />
                  
                  <Button
                    variant={actionFilter === 'ALL' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActionFilter('ALL')}
                    className={actionFilter === 'ALL' 
                      ? 'bg-gradient-to-r from-[#149fad] to-[#117a85] hover:from-[#117a85] hover:to-[#0d5f68] text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-4 border-0' 
                      : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#149fad] hover:text-[#149fad] transition-all duration-200 rounded-full px-4'}
                  >
                    <History className="h-4 w-4 mr-1.5" />
                    {t('loginLogs.all')}
                  </Button>
                  <Button
                    variant={actionFilter === 'LOGIN' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActionFilter('LOGIN')}
                    className={actionFilter === 'LOGIN' 
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-4 border-0' 
                      : 'bg-white text-emerald-600 border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 rounded-full px-4'}
                  >
                    <LogIn className="h-4 w-4 mr-1.5" />
                    {t('loginLogs.logins')}
                  </Button>
                  <Button
                    variant={actionFilter === 'LOGOUT' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActionFilter('LOGOUT')}
                    className={actionFilter === 'LOGOUT' 
                      ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-4 border-0' 
                      : 'bg-white text-rose-600 border-2 border-rose-200 hover:border-rose-400 hover:bg-rose-50 transition-all duration-200 rounded-full px-4'}
                  >
                    <LogOut className="h-4 w-4 mr-1.5" />
                    {t('loginLogs.logouts')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0 z-10">
                      <TableRow className="border-b border-gray-200 hover:bg-transparent">
                        <TableHead onClick={() => handleSort('user')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            {t('loginLogs.user')}
                            <ArrowUpDown className="h-4 w-4 opacity-70" />
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort('action')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {t('loginLogs.action')}
                            <ArrowUpDown className="h-4 w-4 opacity-70" />
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort('ip')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            {t('loginLogs.ipAddress')}
                            <ArrowUpDown className="h-4 w-4 opacity-70" />
                          </div>
                        </TableHead>
                        <TableHead className="text-gray-800 font-semibold py-4 px-6">
                          <div className="flex items-center gap-2">
                            <CustomIcon name="Mail" className="h-4 w-4" iconType="custom" />
                            {t('loginLogs.device')}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => handleSort('date')} className="cursor-pointer text-gray-800 font-semibold py-4 px-6 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {t('loginLogs.date')}
                            <ArrowUpDown className="h-4 w-4 opacity-70" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-600">
                            {t('loginLogs.loading')}
                          </TableCell>
                        </TableRow>
                      ) : sortedLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-600">
                            {t('loginLogs.noLogsFound')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedLogs.map((log) => (
                          <TableRow key={log.id} className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 border-b border-gray-100/50">
                            <TableCell className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#149fad] rounded-xl flex items-center justify-center text-sm font-semibold text-white shadow-lg">
                                  {getUserDisplayName(log.user).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                    {getUserDisplayName(log.user)}
                                  </div>
                                  <div className="text-xs text-gray-500">@{log.user.username}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              {getActionBadge(log.action)}
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <Tooltip content={log.ipAddress || t('loginLogs.na')}>
                                <div className="flex items-center gap-2 text-sm text-gray-600 cursor-help">
                                  <div className="p-1.5 bg-gray-100 rounded-lg">
                                    <Monitor className="h-3 w-3 text-gray-500" />
                                  </div>
                                  <span className="font-medium truncate max-w-[120px]">{log.ipAddress || t('loginLogs.na')}</span>
                                </div>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <Tooltip content={log.userAgent || t('loginLogs.na')} contentClassName="max-w-md whitespace-normal">
                                <span className="text-sm text-gray-600 truncate max-w-[200px] block cursor-help">
                                  {log.userAgent || t('loginLogs.na')}
                                </span>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="p-1.5 bg-gray-100 rounded-lg">
                                  <Calendar className="h-3 w-3 text-gray-500" />
                                </div>
                                <span className="font-medium">{formatDate(log.createdAt)}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View - Cards */}
                <div className="lg:hidden p-4 space-y-4">
                  {loading ? (
                    <div className="text-center py-8 text-gray-600">Chargement...</div>
                  ) : sortedLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">Aucun log trouvé</div>
                  ) : (
                    sortedLogs.map((log) => (
                      <div key={log.id} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#149fad] rounded-xl flex items-center justify-center text-lg font-semibold text-white shadow-lg">
                              {getUserDisplayName(log.user).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">
                                {getUserDisplayName(log.user)}
                              </div>
                              <div className="text-xs text-gray-500">@{log.user.username}</div>
                            </div>
                          </div>
                          {getActionBadge(log.action)}
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Monitor className="h-4 w-4" />
                            <span>{log.ipAddress || t('loginLogs.na')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(log.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                <div className="bg-white border-t border-gray-200 px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#149fad] rounded-lg shadow-sm">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {pagination.total} {t('loginLogs.entries')}
                        </p>
                        <p className="text-xs text-gray-600">
                          {t('loginLogs.showing')} {((pagination.page - 1) * pagination.limit) + 1} {t('loginLogs.to')} {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center sm:justify-end gap-2 overflow-x-auto pb-2 sm:pb-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.page === 1}
                        className="bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 shadow-sm flex-shrink-0"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 shadow-sm flex-shrink-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-2 px-4 py-2 bg-[#149fad]/10 rounded-lg border border-[#149fad]/20 shadow-sm whitespace-nowrap">
                        <span className="text-sm font-bold text-[#149fad]">
                          {t('loginLogs.page')} {pagination.page} {t('loginLogs.of')} {pagination.pages}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 shadow-sm flex-shrink-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.pages)}
                        disabled={pagination.page === pagination.pages}
                        className="bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 shadow-sm flex-shrink-0"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
      <ConfirmationDialog />
    </ToastProvider>
  )
}
