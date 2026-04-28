// src/app/pages/components/TranslationHelper.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useTranslationDetector } from '@/utils/translationDetector'
import { useLanguage } from '@/utils/LanguageContext'
import { Button } from './button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Badge } from './badge'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { 
  Languages, Download, Trash2, RefreshCw, AlertTriangle, 
  CheckCircle, Copy, Eye, EyeOff 
} from 'lucide-react'

interface TranslationHelperProps {
  showButton?: boolean
  position?: 'fixed' | 'relative'
}

export function TranslationHelper({ 
  showButton = true, 
  position = 'fixed' 
}: TranslationHelperProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<any>({})
  const [missingTranslations, setMissingTranslations] = useState<any[]>([])
  const { language } = useLanguage()
  const detector = useTranslationDetector()

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const refreshData = () => {
    setStats(detector.getStats())
    setMissingTranslations(detector.getMissingTranslations())
  }

  useEffect(() => {
    if (isOpen) {
      refreshData()
    }
  }, [isOpen])

  const exportTranslations = () => {
    const data = detector.exportMissingTranslations()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `missing-translations-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const generateTranslationKeys = () => {
    const keys = detector.generateTranslationKeys()
    const jsonString = JSON.stringify(keys, null, 2)
    copyToClipboard(jsonString)
    alert('Translation keys copied to clipboard!')
  }

  if (!showButton) return null

  return (
    <>
      {/* Floating Button */}
      <div className={`${position === 'fixed' ? 'fixed bottom-4 left-4 z-50' : ''}`}>
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
        >
          <Languages className="w-4 h-4 mr-2" />
          Translation Helper
          {stats.total > 0 && (
            <Badge variant="destructive" className="ml-2">
              {stats.total}
            </Badge>
          )}
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              Translation Helper - Development Tool
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.total || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Missing</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.byLanguage?.ar || 0}
                    </div>
                    <div className="text-sm text-gray-600">Arabic Missing</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.byLanguage?.en || 0}
                    </div>
                    <div className="text-sm text-gray-600">English Missing</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Object.keys(stats.byPage || {}).length}
                    </div>
                    <div className="text-sm text-gray-600">Pages Affected</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={refreshData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportTranslations} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button onClick={generateTranslationKeys} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy Keys
              </Button>
              <Button 
                onClick={() => {
                  detector.clear()
                  refreshData()
                }} 
                variant="outline" 
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>

            {/* Missing Translations List */}
            {missingTranslations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Missing Translations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {missingTranslations.map((missing, index) => (
                      <div 
                        key={index}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={missing.language === 'ar' ? 'destructive' : 'secondary'}
                              >
                                {missing.language}
                              </Badge>
                              <Badge variant="outline">
                                {missing.page}
                              </Badge>
                            </div>
                            <div className="text-sm font-mono bg-white p-2 rounded border">
                              <div><strong>Key:</strong> {missing.key}</div>
                              <div><strong>Text:</strong> {missing.text}</div>
                            </div>
                          </div>
                          <Button
                            onClick={() => copyToClipboard(missing.key)}
                            variant="ghost"
                            size="sm"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div>Missing translations are marked with 🔴 in Arabic mode</div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>Use "Export JSON" to get missing translations in JSON format</div>
                </div>
                <div className="flex items-start gap-2">
                  <Copy className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>Use "Copy Keys" to get translation keys ready for ar.json/en.json</div>
                </div>
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-purple-500 mt-0.5" />
                  <div>Open browser console and use <code>window.translationDetector</code> for more options</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
