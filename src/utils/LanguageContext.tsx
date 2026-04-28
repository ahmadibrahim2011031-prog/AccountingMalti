// src/utils/LanguageContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { translationDetector } from './translationDetector'

type Locale = 'ar' | 'en'

interface LanguageContextType {
  language: Locale
  setLanguage: (lang: Locale) => void
  toggleLanguage: () => void
  isRTL: boolean
  t: (key: string, fallback?: string) => string
  formatMessage: (key: string, params?: Record<string, string>) => string
  getDirectionalClass: (ltrClass: string, rtlClass?: string) => string
  getSpacingClass: (spacing: string) => string
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// ✅ LOAD FROM JSON FILES - OPTIMIZED
const loadDictionary = async (locale: Locale) => {
  try {
    // For server-side rendering, use fs.readFileSync
    if (typeof window === 'undefined') {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(process.cwd(), 'src', 'utils', `${locale}.json`)
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const translations = JSON.parse(fileContent)
      return translations
    } else {
      // Client-side: use dynamic import (no API call needed)
      const translations = await import(`@/utils/${locale}.json`)
      return translations.default || translations
    }
  } catch (error) {
    console.error(`❌ Failed to load dictionary for locale: ${locale}`, error)
    return {}
  }
}

const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null
  }, obj)
}

// Initialize translations synchronously for server-side rendering
const getInitialTranslations = (): Record<string, any> => {
  if (typeof window === 'undefined') {
    // Server-side: load translations synchronously using fs.readFileSync
    try {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(process.cwd(), 'src', 'utils', 'ar.json')
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const translations = JSON.parse(fileContent)
      return translations
    } catch (error) {
      console.error(`❌ Server-side translation loading failed:`, error)
      return {}
    }
  }
  return {}
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Locale>('ar')
  const [translations, setTranslations] = useState<any>(getInitialTranslations())
  const [isLoading, setIsLoading] = useState(true)

  const setLanguage = async (lang: Locale) => {
    setIsLoading(true)
    setLanguageState(lang)
    
    const dictionary = await loadDictionary(lang)
    setTranslations(dictionary)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
      document.documentElement.lang = lang
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
      document.body.className = document.body.className.replace(/\b(rtl|ltr)\b/g, '')
      document.body.classList.add(lang === 'ar' ? 'rtl' : 'ltr')
    }
    
    setIsLoading(false)
  }

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar')
  }

  const t = (key: string, fallback?: string): string => {
    const value = getNestedValue(translations, key)
    if (value === null || value === undefined) {
      const displayText = fallback || key

      // Track missing translation
      if (process.env.NODE_ENV === 'development') {
        const currentPage = typeof window !== 'undefined' ? window.location.pathname : 'unknown'
        translationDetector.trackMissing(key, displayText, currentPage, language)

        console.group(`🔍 Translation Missing`)
        console.warn(`Key: ${key}`)
        console.warn(`Language: ${language}`)
        console.warn(`Page: ${currentPage}`)
        console.warn(`Fallback: ${fallback || 'None'}`)
        console.warn(`Will display: ${displayText}`)
        console.groupEnd()

        // Add visual indicator in development for Arabic missing translations
        if (typeof window !== 'undefined' && language === 'ar') {
          return `🔴 ${displayText}`
        }
      }
      return displayText
    }
    return value
  }

  const formatMessage = (key: string, params: Record<string, string> = {}): string => {
    let message = t(key)
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(`{${param}}`, value)
    })
    return message
  }

  const getDirectionalClass = (ltrClass: string, rtlClass?: string): string => {
    return isRTL ? (rtlClass || ltrClass) : ltrClass
  }

  const getSpacingClass = (spacing: string): string => {
    if (isRTL) {
      return spacing.replace('mr-', 'temp-').replace('ml-', 'mr-').replace('temp-', 'ml-')
        .replace('pl-', 'temp-').replace('pr-', 'pl-').replace('temp-', 'pr-')
        .replace('left-', 'temp-').replace('right-', 'left-').replace('temp-', 'right-')
    }
    return spacing
  }

  useEffect(() => {
    const initializeLanguage = async () => {
      if (typeof window !== 'undefined') {
        const savedLang = localStorage.getItem('language') as Locale
        const initialLang = (savedLang && (savedLang === 'ar' || savedLang === 'en')) ? savedLang : 'ar'

        const dictionary = await loadDictionary(initialLang)
        setTranslations(dictionary)
        setLanguageState(initialLang)

        document.documentElement.lang = initialLang
        document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr'
        document.body.className = document.body.className.replace(/\b(rtl|ltr)\b/g, '')
        document.body.classList.add(initialLang === 'ar' ? 'rtl' : 'ltr')
      }
      setIsLoading(false)
    }

    initializeLanguage()
  }, [])

  const isRTL = language === 'ar'

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      toggleLanguage,
      isRTL,
      t,
      formatMessage,
      getDirectionalClass,
      getSpacingClass,
      isLoading
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export function useTranslation() {
  return useLanguage()
}

interface LocaleContextType {
  currency: string
  locale: string
  timezone: string
  numberFormat: Intl.NumberFormat
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage()

  const localeConfig = {
    currency: 'QAR',
    locale: language === 'ar' ? 'ar-QA' : 'en-QA',
    timezone: 'Asia/Qatar',
    numberFormat: new Intl.NumberFormat(language === 'ar' ? 'ar-QA' : 'en-QA', {
      style: 'currency',
      currency: 'QAR'
    })
  }

  return (
    <LocaleContext.Provider value={localeConfig}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider, which must be inside a LanguageProvider')
  }
  return context
}

export type { Locale }