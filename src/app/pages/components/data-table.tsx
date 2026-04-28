'use client'

import React, { useState, useMemo } from 'react'
import { Search, Plus, Eye, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { useLanguage } from '@/utils/LanguageContext'

import { cn } from '@/utils/utils'


interface Column<T = any> {
  key: keyof T | string
  label: string
  render?: (item: T, index?: number) => React.ReactNode
  sortable?: boolean
  className?: string
  width?: string
}

interface DataTableProps<T extends { id: string }> {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  onAdd?: () => void
  onView?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  addButtonText?: string
  loading?: boolean
  emptyMessage?: string
  showSearch?: boolean
  showActions?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    onPageChange?: (page: number) => void
  }
  filters?: React.ReactNode
  className?: string
  actions?: (item: T, index?: number) => React.ReactNode
  onSearchChange?: (value: string) => void
}

export function DataTable<T extends { id: string }>({
  data = [],
  columns,
  searchPlaceholder = "Search...",
  onAdd,
  onView,
  onEdit,
  onDelete,
  addButtonText = "Add New",
  loading = false,
  emptyMessage = "No data found",
  showSearch = true,
  showActions = true,
  pagination,
  filters,
  className,
  actions,
  onSearchChange
}: DataTableProps<T>) {
  const { language, isRTL, t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    onSearchChange?.(value)
  }

  // Process data with search and sorting
  const processedData = useMemo(() => {
    const safeData = Array.isArray(data) ? data : []
    let filtered = safeData

    // Apply search filter only if no external search handler
    if (searchTerm && !onSearchChange && filtered.length > 0) {
      filtered = safeData.filter(item =>
        Object.values(item || {}).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply sorting
    if (sortColumn && filtered.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a?.[sortColumn as keyof T]
        const bValue = b?.[sortColumn as keyof T]
        
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1
        
        let comparison = 0
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue)
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue
        } else {
          comparison = String(aValue).localeCompare(String(bValue))
        }
        
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [data, searchTerm, sortColumn, sortDirection, onSearchChange])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />
  }

  const hasActions = showActions && (onView || onEdit || onDelete || actions)

  // Loading state
  if (loading) {
    return (
      <div className={cn("w-full space-y-4", isRTL && "dir-rtl", className)}>
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className={cn(
            "flex justify-between items-center mb-6",
            isRTL && "flex-row-reverse"
          )}>
            <div className="h-10 bg-gray-200 rounded w-64"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          
          {/* Table skeleton */}
          <div className="border rounded-lg overflow-hidden">
            <div className="h-12 bg-gray-100"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 border-t"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "w-full space-y-6",
      isRTL && "dir-rtl",
      className
    )}>
      {/* Header */}
      {(showSearch || onAdd || filters) && (
        <div className={cn(
          "flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between",
          isRTL && "lg:flex-row-reverse"
        )}>
          {/* Left side - Search and Filters */}
          <div className={cn(
            "flex flex-col sm:flex-row gap-3 flex-1",
            isRTL && "sm:flex-row-reverse"
          )}>
            {showSearch && (
              <div className="relative max-w-sm">
                <Search className={cn(
                  "absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4",
                  isRTL ? "right-3" : "left-3"
                )} />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={cn(
                    "h-10 w-full sm:w-64",
                    isRTL ? "pr-10 text-right" : "pl-10"
                  )}
                />
              </div>
            )}
            {filters && (
              <div className="flex-1">
                {filters}
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          {onAdd && (
            <Button 
              onClick={onAdd} 
              className={cn(
                "flex items-center gap-2 h-10 whitespace-nowrap",
                isRTL && "flex-row-reverse"
              )}
            >
              <Plus className="w-4 h-4" />
              {addButtonText}
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
            <thead className="bg-gray-50 border-b">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={cn(
                      "px-6 py-4 text-sm font-semibold text-gray-900",
                      isRTL ? "text-right" : "text-left",
                      column.sortable && "cursor-pointer hover:bg-gray-100 transition-colors select-none",
                      column.className
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key as string)}
                  >
                    <div className={cn(
                      "flex items-center gap-2",
                      isRTL && "flex-row-reverse",
                      column.sortable && "justify-between"
                    )}>
                      <span>{column.label}</span>
                      {column.sortable && (
                        <div className="flex items-center">
                          {getSortIcon(column.key as string)}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                {hasActions && (
                  <th className={cn(
                    "px-6 py-4 text-sm font-semibold text-gray-900 w-32",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    {/* ✅ FIXED: Use t as function instead of object */}
                    {t('common.actions', language === 'ar' ? 'الإجراءات' : 'Actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!Array.isArray(processedData) || processedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length + (hasActions ? 1 : 0)} 
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <div className="text-5xl opacity-50">📋</div>
                      <div className="text-lg font-medium">
                        {!Array.isArray(data) ? 'Data format error' : emptyMessage}
                      </div>
                      {searchTerm && !onSearchChange && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSearchChange('')}
                          className="mt-2"
                        >
                          {/* ✅ FIXED: Use t as function instead of object */}
                          {t('common.cancel', language === 'ar' ? 'مسح البحث' : 'Clear Search')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                processedData.map((item, index) => (
                  <tr 
                    key={item?.id || index} 
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={cn(
                          "px-6 py-4 text-sm text-gray-900",
                          isRTL ? "text-right" : "text-left",
                          column.className
                        )}
                      >
                        {column.render 
                          ? column.render(item, index)
                          : String(item?.[column.key as keyof T] || '')
                        }
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-6 py-4 text-sm">
                        <div className={cn(
                          "flex items-center gap-1 justify-center",
                          isRTL && "flex-row-reverse"
                        )}>
                          {actions ? (
                            actions(item, index)
                          ) : (
                            <>
                              {onView && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onView(item)}
                                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  title={t('common.view', language === 'ar' ? 'عرض' : 'View')} // ✅ FIXED
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(item)}
                                  className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
                                  title={t('common.edit', language === 'ar' ? 'تعديل' : 'Edit')} // ✅ FIXED
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDelete(item)}
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  title={t('common.delete', language === 'ar' ? 'حذف' : 'Delete')} // ✅ FIXED
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 px-4 py-3 bg-gray-50 rounded-lg",
        isRTL && "sm:flex-row-reverse"
      )}>
        {/* Results count */}
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <span>
            {language === 'ar' 
              ? `عرض ${processedData?.length || 0} من ${Array.isArray(data) ? data.length : 0} عنصر`
              : `Showing ${processedData?.length || 0} of ${Array.isArray(data) ? data.length : 0} items`
            }
          </span>
          {searchTerm && !onSearchChange && (
            <span className="text-blue-600 font-medium">
              ({language === 'ar' ? 'مُرشح' : 'filtered'})
            </span>
          )}
        </div>

        {/* Pagination */}
        {pagination && (
          <div className={cn(
            "flex items-center gap-2",
            isRTL && "flex-row-reverse"
          )}>
            {/* In RTL (Arabic), Next button comes first visually (on the right) */}
            {isRTL ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange?.(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                  className="h-8"
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>

                <span className="px-3 py-1 text-sm">
                  {language === 'ar'
                    ? `صفحة ${pagination.page} من ${Math.ceil(pagination.total / pagination.limit)}`
                    : `Page ${pagination.page} of ${Math.ceil(pagination.total / pagination.limit)}`
                  }
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange?.(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="h-8"
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange?.(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="h-8"
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>

                <span className="px-3 py-1 text-sm">
                  {language === 'ar'
                    ? `صفحة ${pagination.page} من ${Math.ceil(pagination.total / pagination.limit)}`
                    : `Page ${pagination.page} of ${Math.ceil(pagination.total / pagination.limit)}`
                  }
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pagination.onPageChange?.(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                  className="h-8"
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Clear search */}
        {searchTerm && !pagination && !onSearchChange && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSearchChange('')}
            className="h-8"
          >
            {/* ✅ FIXED: Use t as function instead of object */}
            {t('common.cancel', language === 'ar' ? 'مسح البحث' : 'Clear Search')}
          </Button>
        )}
      </div>
    </div>
  )
}

// Export additional utility types and functions
export interface DataTableColumn<T = any> extends Column<T> {}

// Quick utility to create simple columns
export const createSimpleColumns = <T extends Record<string, any>>(
  fields: Array<{
    key: keyof T
    label: string
    render?: (item: T, index?: number) => React.ReactNode
    sortable?: boolean
  }>
): DataTableColumn<T>[] => {
  return fields.map(field => ({
    key: field.key as string,
    label: field.label,
    render: field.render,
    sortable: field.sortable ?? true
  }))
}