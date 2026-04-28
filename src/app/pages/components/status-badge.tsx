// src/app/components/status-badge.tsx - FINAL FIXED VERSION
import React from 'react'
import { cn } from '@/utils/utils'

import { useLanguage } from '@/utils/LanguageContext'

interface StatusBadgeProps {
  status: string | null | undefined
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

// Maps statuses to color variants
const statusVariants: { [key: string]: string } = {
  default: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200',
  success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
  danger: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
}

// Automatically determines the variant based on the status string
const getStatusVariant = (status: string): keyof typeof statusVariants => {
  const s = status?.toLowerCase() || ''
  
  if (['active', 'available', 'delivered', 'paid', 'verified', 'resolved', 'income', 'approved', 'completed'].includes(s)) {
    return 'success'
  }
  
  if (['pending', 'training', 'maintenance', 'in_progress', 'processing', 'partial'].includes(s)) {
    return 'warning'
  }
  
  if (['inactive', 'suspended', 'terminated', 'cancelled', 'failed', 'out_of_service', 'expired', 'dismissed', 'expense', 'overdue', 'rejected'].includes(s)) {
    return 'danger'
  }
  
  if (['assigned', 'picked_up', 'in_transit', 'open', 'appealed'].includes(s)) {
    return 'info'
  }
  
  return 'default'
}

// Centralized translations for all status types
const statusTranslations: { [key: string]: { en: string; ar: string } } = {
  // General & Driver
  ACTIVE: { en: 'Active', ar: 'نشط' },
  INACTIVE: { en: 'Inactive', ar: 'غير نشط' },
  SUSPENDED: { en: 'Suspended', ar: 'موقوف' },
  TERMINATED: { en: 'Terminated', ar: 'منتهي الخدمة' },
  
  // Vehicle
  AVAILABLE: { en: 'Available', ar: 'متاح' },
  ASSIGNED: { en: 'Assigned', ar: 'مُخصص' },
  MAINTENANCE: { en: 'Maintenance', ar: 'صيانة' },
  OUT_OF_SERVICE: { en: 'Out of Service', ar: 'خارج الخدمة' },
  
  // Delivery
  PENDING: { en: 'Pending', ar: 'قيد الانتظار' },
  PICKED_UP: { en: 'Picked Up', ar: 'تم الاستلام' },
  IN_TRANSIT: { en: 'In Transit', ar: 'في الطريق' },
  DELIVERED: { en: 'Delivered', ar: 'تم التوصيل' },
  CANCELLED: { en: 'Cancelled', ar: 'ملغي' },
  FAILED: { en: 'Failed', ar: 'فشل' },
  
  // Payment & Financial
  PAID: { en: 'Paid', ar: 'مدفوع' },
  INCOME: { en: 'Income', ar: 'دخل' },
  EXPENSE: { en: 'Expense', ar: 'مصروف' },
  APPROVED: { en: 'Approved', ar: 'موافق عليه' },
  PROCESSING: { en: 'Processing', ar: 'قيد المعالجة' },
  OVERDUE: { en: 'Overdue', ar: 'متأخر' },
  PARTIAL: { en: 'Partial', ar: 'جزئي' },
  
  // Legal
  OPEN: { en: 'Open', ar: 'مفتوحة' },
  IN_PROGRESS: { en: 'In Progress', ar: 'قيد المتابعة' },
  RESOLVED: { en: 'Resolved', ar: 'تم حلها' },
  DISMISSED: { en: 'Dismissed', ar: 'مرفوضة' },
  CLOSED: { en: 'Closed', ar: 'مغلقة' },
  APPEALED: { en: 'Appealed', ar: 'مستأنفة' },
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const { language } = useLanguage()
  
  // ✅ FIXED: Handle null/undefined status
  if (!status || status === null || status === undefined) {
    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusVariants.default,
        className
      )}>
        {language === 'ar' ? 'غير محدد' : 'N/A'}
      </span>
    )
  }

  // Convert status to string safely
  const statusString = String(status).trim()
  
  if (!statusString) {
    return (
      <span className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusVariants.default,
        className
      )}>
        {language === 'ar' ? 'غير محدد' : 'N/A'}
      </span>
    )
  }

  const autoVariant = variant || getStatusVariant(statusString)
  const translation = statusTranslations[statusString.toUpperCase()] || { 
    en: statusString.replace(/_/g, ' '), 
    ar: statusString.replace(/_/g, ' ') 
  }
  const displayText = language === 'ar' ? translation.ar : translation.en
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border',
      statusVariants[autoVariant],
      className
    )}>
      {displayText}
    </span>
  )
}