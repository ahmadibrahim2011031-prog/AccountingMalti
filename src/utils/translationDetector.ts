// src/utils/translationDetector.ts
// Translation Detection and Management Utility

interface MissingTranslation {
  key: string
  text: string
  page: string
  timestamp: Date
  language: string
}

class TranslationDetector {
  private missingTranslations: MissingTranslation[] = []
  private isEnabled: boolean = process.env.NODE_ENV === 'development'

  // Track missing translation
  trackMissing(key: string, text: string, page: string, language: string) {
    if (!this.isEnabled) return

    const missing: MissingTranslation = {
      key,
      text,
      page,
      timestamp: new Date(),
      language
    }

    // Avoid duplicates
    const exists = this.missingTranslations.some(
      m => m.key === key && m.language === language && m.page === page
    )

    if (!exists) {
      this.missingTranslations.push(missing)
      console.warn(`🔍 Missing Translation:`, missing)
    }
  }

  // Get all missing translations
  getMissingTranslations(): MissingTranslation[] {
    return this.missingTranslations
  }

  // Get missing translations by language
  getMissingByLanguage(language: string): MissingTranslation[] {
    return this.missingTranslations.filter(m => m.language === language)
  }

  // Get missing translations by page
  getMissingByPage(page: string): MissingTranslation[] {
    return this.missingTranslations.filter(m => m.page === page)
  }

  // Export missing translations as JSON
  exportMissingTranslations(): string {
    const grouped = this.groupMissingTranslations()
    return JSON.stringify(grouped, null, 2)
  }

  // Group missing translations by language and page
  private groupMissingTranslations() {
    const grouped: Record<string, Record<string, string[]>> = {}

    this.missingTranslations.forEach(missing => {
      if (!grouped[missing.language]) {
        grouped[missing.language] = {}
      }
      if (!grouped[missing.language][missing.page]) {
        grouped[missing.language][missing.page] = []
      }
      grouped[missing.language][missing.page].push(missing.key)
    })

    return grouped
  }

  // Generate translation keys for missing items
  generateTranslationKeys(): Record<string, Record<string, string>> {
    const keys: Record<string, Record<string, string>> = {}

    this.missingTranslations.forEach(missing => {
      if (!keys[missing.language]) {
        keys[missing.language] = {}
      }
      
      // Use the original text as the value for English, empty for Arabic
      if (missing.language === 'en') {
        keys[missing.language][missing.key] = missing.text
      } else {
        keys[missing.language][missing.key] = `[TRANSLATE: ${missing.text}]`
      }
    })

    return keys
  }

  // Clear all tracked missing translations
  clear() {
    this.missingTranslations = []
  }

  // Get statistics
  getStats() {
    const byLanguage = this.missingTranslations.reduce((acc, missing) => {
      acc[missing.language] = (acc[missing.language] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byPage = this.missingTranslations.reduce((acc, missing) => {
      acc[missing.page] = (acc[missing.page] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: this.missingTranslations.length,
      byLanguage,
      byPage,
      lastUpdated: this.missingTranslations.length > 0 
        ? this.missingTranslations[this.missingTranslations.length - 1].timestamp 
        : null
    }
  }

  // Enable/disable detection
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  // Check if text looks like English (simple heuristic)
  isLikelyEnglish(text: string): boolean {
    // Check for common English patterns
    const englishPatterns = [
      /^[a-zA-Z\s\-_]+$/, // Only Latin characters, spaces, hyphens, underscores
      /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/i, // Common English words
      /[A-Z][a-z]+/, // Capitalized words
    ]

    return englishPatterns.some(pattern => pattern.test(text))
  }

  // Scan text for potential untranslated content
  scanForUntranslated(text: string, context: string = 'unknown'): boolean {
    if (!this.isEnabled) return false

    // Skip if text is too short or looks like a variable
    if (text.length < 2 || /^[A-Z_]+$/.test(text)) return false

    // Check if it looks like English
    if (this.isLikelyEnglish(text)) {
      this.trackMissing(
        `auto_detected_${Date.now()}`,
        text,
        context,
        'auto-detected'
      )
      return true
    }

    return false
  }


}

// Global instance
export const translationDetector = new TranslationDetector()

// Hook for React components
export function useTranslationDetector() {
  return {
    trackMissing: translationDetector.trackMissing.bind(translationDetector),
    getMissingTranslations: translationDetector.getMissingTranslations.bind(translationDetector),
    exportMissingTranslations: translationDetector.exportMissingTranslations.bind(translationDetector),
    getStats: translationDetector.getStats.bind(translationDetector),
    clear: translationDetector.clear.bind(translationDetector),
    scanForUntranslated: translationDetector.scanForUntranslated.bind(translationDetector),
    generateTranslationKeys: translationDetector.generateTranslationKeys.bind(translationDetector),
  }
}

// Console commands for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).translationDetector = {
    getStats: () => translationDetector.getStats(),
    getMissing: () => translationDetector.getMissingTranslations(),
    export: () => {
      const data = translationDetector.exportMissingTranslations()
      console.log('Missing Translations:', data)
      return data
    },
    clear: () => translationDetector.clear(),
    generateKeys: () => {
      const keys = translationDetector.generateTranslationKeys()
      console.log('Generated Translation Keys:', keys)
      return keys
    }
  }
  
  console.log('🔍 Translation Detector loaded. Use window.translationDetector in console.')
}
