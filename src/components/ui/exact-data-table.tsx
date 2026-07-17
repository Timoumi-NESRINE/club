"use client"

import React, { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: keyof T | string
  header: string
  cell?: (item: T) => React.ReactNode
  sortable?: boolean
  width?: string
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  onPageChange?: (page: number) => void
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  actions?: (item: T) => React.ReactNode
  emptyMessage?: string
  className?: string
  title?: string
  subtitle?: string
  addButtonText?: string
  onAdd?: () => void
}

export function ExactDataTable<T = Record<string, unknown>>({
  data,
  columns,
  loading = false,
  searchable = false,
  searchPlaceholder,
  onSearch,
  pagination,
  onPageChange,
  onSort,
  actions,
  emptyMessage,
  className,
  title,
  subtitle,
  addButtonText,
  onAdd
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Use props if provided, otherwise use translated defaults
  const finalSearchPlaceholder = searchPlaceholder || t('common.search')
  const finalEmptyMessage = emptyMessage || t('clients.noClients') // Default to no clients or generic
  const finalTitle = title || t('common.welcome')
  const finalButtonText = addButtonText || t('common.create')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  const handleSort = (columnKey: string) => {
    if (!onSort) return

    let newDirection: 'asc' | 'desc' = 'asc'

    if (sortColumn === columnKey) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    }

    setSortColumn(columnKey)
    setSortDirection(newDirection)
    onSort(columnKey, newDirection)
  }

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />
    }

    return sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3 text-[#149fad]" />
      : <ArrowDown className="ml-1 h-3 w-3 text-[#149fad]" />
  }

  const getCellValue = (item: T, column: Column<T>): React.ReactNode => {
    if (column.cell) {
      return column.cell(item)
    }
    const value = item[column.key as keyof T]
    return value != null ? String(value) : ''
  }

  return (
    <div className={cn("bg-white", className)}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{finalTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        {onAdd && (
          <Button
            onClick={onAdd}
            className="bg-[#149fad] hover:bg-[#128a96] text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {finalButtonText}
          </Button>
        )}
      </div>

      {/* Search */}
      {searchable && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={finalSearchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as React.KeyboardEvent<HTMLInputElement>)}
              className="pl-10 border-gray-200 focus:border-[#149fad] focus:ring-[#149fad]"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                >
                  {column.sortable && onSort ? (
                    <button
                      className="flex items-center hover:text-gray-700 transition-colors"
                      onClick={() => handleSort(String(column.key))}
                    >
                      <span>{column.header}</span>
                      {getSortIcon(String(column.key))}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  {t('common.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#149fad]"></div>
                    <span className="ml-2 text-gray-500">{t('common.loading')}</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  {finalEmptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-4 py-4 text-sm text-gray-900"
                    >
                      {getCellValue(item, column)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {actions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {t('common.itemsFound', { total: pagination.total })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm text-gray-600">
              {t('common.pageLabel')} {pagination.page} {t('common.of')} {pagination.pages}
            </span>

            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Composants d'action pour correspondre à l'image
export function ActionButton({
  icon: Icon,
  onClick,
  className = "",
  title
}: {
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  className?: string
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-1 rounded hover:bg-gray-100 transition-colors",
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

export function ViewAction({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return <ActionButton icon={Eye} onClick={onClick} className="text-gray-500 hover:text-gray-700" title={t('common.view')} />
}

export function EditAction({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return <ActionButton icon={Edit} onClick={onClick} className="text-blue-500 hover:text-blue-700" title={t('common.edit')} />
}

export function DeleteAction({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return <ActionButton icon={Trash2} onClick={onClick} className="text-red-500 hover:text-red-700" title={t('common.delete')} />
}
