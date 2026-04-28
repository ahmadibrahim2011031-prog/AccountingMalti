// src/lib/utils.ts - ENHANCED WITH CURRENCY & FORMATTING UTILITIES
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// ✅ Original cn function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ CURRENCY & FORMATTING UTILITIES (from currency.ts)

/**
 * Format currency based on locale and currency code
 * Always uses English/Latin numerals (0-9) regardless of language
 */
export function formatCurrency(
  amount: number,
  currency: string = 'QAR',
  language: string = 'ar',
  options?: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    showCurrencyCode?: boolean
    compact?: boolean
  }
): string {
  const locale = language === 'ar' ? 'ar-QA' : 'en-QA'
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showCurrencyCode = false,
    compact = false
  } = options || {}

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
      currencyDisplay: showCurrencyCode ? 'code' : 'symbol',
      notation: compact ? 'compact' : 'standard',
      compactDisplay: compact ? 'short' : undefined,
      numberingSystem: 'latn', // Always use English numerals (0-9)
    })
    return formatter.format(amount)
  } catch (error) {
    const formattedAmount = amount.toFixed(minimumFractionDigits)
    if (language === 'ar') {
      return `${formattedAmount} ${currency === 'QAR' ? 'ر.ق' : currency}`
    }
    return `${currency} ${formattedAmount}`
  }
}

/**
 * Format numbers based on locale
 * Always uses English/Latin numerals (0-9) regardless of language
 */
export function formatNumber(
  number: number,
  language: string = 'ar',
  options?: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    compact?: boolean
    style?: 'decimal' | 'percent'
  }
): string {
  const locale = language === 'ar' ? 'ar-QA' : 'en-QA'
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 3,
    compact = false,
    style = 'decimal'
  } = options || {}

  try {
    return new Intl.NumberFormat(locale, {
      style,
      minimumFractionDigits,
      maximumFractionDigits,
      notation: compact ? 'compact' : 'standard',
      compactDisplay: compact ? 'short' : undefined,
      numberingSystem: 'latn', // Always use English numerals (0-9)
    }).format(number)
  } catch (error) {
    return number.toString()
  }
}

/**
 * Format date based on locale
 * Always uses English/Latin numerals (0-9) regardless of language
 */
export function formatDate(
  date: Date | string,
  language: string = 'ar',
  options?: {
    dateStyle?: 'full' | 'long' | 'medium' | 'short'
    customFormat?: Intl.DateTimeFormatOptions
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const locale = language === 'ar' ? 'ar-QA' : 'en-QA'
  const { dateStyle = 'medium', customFormat } = options || {}

  try {
    if (customFormat) {
      return new Intl.DateTimeFormat(locale, { ...customFormat, numberingSystem: 'latn' }).format(dateObj)
    }
    return new Intl.DateTimeFormat(locale, { dateStyle, numberingSystem: 'latn' }).format(dateObj)
  } catch (error) {
    return dateObj.toLocaleDateString()
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 * Always uses English/Latin numerals (0-9) regardless of language
 */
export function formatRelativeTime(
  date: Date | string,
  language: string = 'ar'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const locale = language === 'ar' ? 'ar-QA' : 'en-QA'
  const diffInSeconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000)

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 }
    ]

    for (const interval of intervals) {
      const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds)
      if (count >= 1) {
        return rtf.format(diffInSeconds > 0 ? -count : count, interval.label as Intl.RelativeTimeFormatUnit)
      }
    }
    return rtf.format(0, 'second')
  } catch (error) {
    const minutes = Math.floor(Math.abs(diffInSeconds) / 60)
    return language === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes} minutes ago`
  }
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number, language: string = 'ar'): string {
  const units = language === 'ar' 
    ? ['بايت', 'ك.بايت', 'م.بايت', 'ج.بايت'] 
    : ['B', 'KB', 'MB', 'GB']
    
  if (bytes === 0) return `0 ${units[0]}`
  
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

/**
 * Parse currency string back to number
 */
export function parseCurrency(currencyString: string): number {
  const cleanString = currencyString.replace(/[^\d.-]/g, '').replace(/,/g, '')
  const parsed = parseFloat(cleanString)
  return isNaN(parsed) ? 0 : parsed
}
// Add these functions to the bottom of your src/lib/utils.ts file

export function formatDateTime(date: string | number | Date, language: string): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function formatTime(date: string | number | Date, language: string): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeStyle: 'short',
  }).format(new Date(date));
}