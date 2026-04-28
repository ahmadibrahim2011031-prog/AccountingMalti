'use client'

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/utils/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/pages/components/card'
import { Button } from '@/app/pages/components/button'
import { Input } from '@/app/pages/components/input'
import { Label } from '@/app/pages/components/label'
import { toast } from 'sonner'
import {
  BookOpen, Calendar, Filter, Download, FileText, TrendingUp, TrendingDown, Search, Edit, Trash2
} from 'lucide-react'
import { cn } from '@/utils/utils'

interface Account {
  id: string
  accountNumber: string
  name: string
  nameAr?: string
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  balance: number
  nature: 'DEBIT' | 'CREDIT'
}

interface JournalEntry {
  id: string
  date: string
  reference: string
  description: string
  descriptionAr?: string
  debit: number
  credit: number
  balance: number
  createdBy?: string
  createdAt: string
}

export function GeneralLedger() {
  const { t, language } = useLanguage()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAccounts()
    // Set default date range to last 12 months (to capture all recent entries)
    const now = new Date()
    const firstDay = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setDateFrom(firstDay.toISOString().split('T')[0])
    setDateTo(lastDay.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (selectedAccount && dateFrom && dateTo) {
      fetchEntries()
    }
  }, [selectedAccount, dateFrom, dateTo])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounting?type=all-accounts')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error(t('accounting.fetchError', 'فشل في جلب البيانات'))
    }
  }

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/accounting?type=ledger&accountId=${selectedAccount}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      )
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()

      // Calculate running balance for each entry
      let runningBalance = data.openingBalance || 0
      const entriesWithBalance = (data.entries || []).map((entry: JournalEntry) => {
        runningBalance += entry.debit - entry.credit
        return { ...entry, balance: runningBalance }
      })

      setEntries(entriesWithBalance)
    } catch (error) {
      console.error('Error fetching entries:', error)
      toast.error(t('accounting.fetchError', 'فشل في جلب البيانات'))
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // Export to CSV
    const account = accounts.find(a => a.id === selectedAccount)
    if (!account) return

    const csvHeaders = ['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance']
    const csvRows = entries.map(entry => [
      entry.date,
      entry.reference,
      language === 'ar' && entry.descriptionAr ? entry.descriptionAr : entry.description,
      Number(entry.debit).toFixed(2),
      Number(entry.credit).toFixed(2),
      Number(entry.balance).toFixed(2)
    ])

    const csv = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ledger_${account.accountNumber}_${dateFrom}_${dateTo}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredEntries = entries.filter(entry => {
    if (!searchTerm) return true
    const description = language === 'ar' && entry.descriptionAr ? entry.descriptionAr : entry.description
    return (
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const selectedAccountData = accounts.find(a => a.id === selectedAccount)
  const totalDebit = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0)
  const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0)
  const currentBalance = filteredEntries.length > 0 ? filteredEntries[filteredEntries.length - 1].balance : 0

  return (
    <div className="space-y-6">
      {/* Account Selection & Filters */}
      <Card className="border-2 border-purple-500">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {t('accounting.generalLedger', 'دفتر الأستاذ')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>{t('accounting.selectAccount', 'اختر الحساب')}</Label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{t('accounting.selectAccountPlaceholder', 'اختر حساباً')}</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.accountNumber} - {language === 'ar' && account.nameAr ? account.nameAr : account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>{t('accounting.dateFrom', 'من تاريخ')}</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{t('accounting.dateTo', 'إلى تاريخ')}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('accounting.searchTransactions', 'بحث في المعاملات...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button
              onClick={handleExport}
              disabled={!selectedAccount || filteredEntries.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('common.export', 'تصدير')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Summary */}
      {selectedAccountData && (
        <Card className="border-2 border-blue-500">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{t('accounting.accountNumber', 'رقم الحساب')}</div>
                <div className="text-xl font-bold text-blue-600">{selectedAccountData.accountNumber}</div>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{t('accounting.totalDebit', 'إجمالي المدين')}</div>
                <div className="text-xl font-bold text-green-600">
                  {Number(totalDebit).toFixed(2)} {t('common.qar', 'ر.ق')}
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{t('accounting.totalCredit', 'إجمالي الدائن')}</div>
                <div className="text-xl font-bold text-red-600">
                  {Number(totalCredit).toFixed(2)} {t('common.qar', 'ر.ق')}
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{t('accounting.currentBalance', 'الرصيد الحالي')}</div>
                <div className={cn(
                  "text-xl font-bold",
                  currentBalance >= 0 ? "text-purple-600" : "text-red-600"
                )}>
                  {Number(currentBalance).toFixed(2)} {t('common.qar', 'ر.ق')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger Entries Table */}
      <Card className="border-2 border-gray-300">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('accounting.transactions', 'المعاملات')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedAccount ? (
            <div className="p-12 text-center text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">{t('accounting.selectAccountToView', 'اختر حساباً لعرض الحركات')}</p>
            </div>
          ) : loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4">{t('common.loading', 'جاري التحميل...')}</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">{t('accounting.noTransactions', 'لا توجد حركات في هذه الفترة')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2">
                  <tr>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      {t('accounting.date', 'التاريخ')}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      {t('accounting.reference', 'المرجع')}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      {t('accounting.description', 'الوصف')}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-green-50">
                      {t('accounting.debit', 'مدين')}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-red-50">
                      {t('accounting.credit', 'دائن')}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 bg-purple-50">
                      {t('accounting.balance', 'الرصيد')}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      {t('common.actions', 'الإجراءات')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredEntries.map((entry) => {
                    const description = language === 'ar' && entry.descriptionAr ? entry.descriptionAr : entry.description
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          {new Date(entry.date).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-blue-600">
                          {entry.reference}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {description}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600 bg-green-50">
                          {entry.debit > 0 ? `${Number(entry.debit).toFixed(2)} ${t('common.qar', 'ر.ق')}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-red-600 bg-red-50">
                          {entry.credit > 0 ? `${Number(entry.credit).toFixed(2)} ${t('common.qar', 'ر.ق')}` : '-'}
                        </td>
                        <td className={cn(
                          "px-4 py-3 text-sm font-bold bg-purple-50",
                          entry.balance >= 0 ? "text-purple-600" : "text-red-600"
                        )}>
                          {Number(entry.balance).toFixed(2)} {t('common.qar', 'ر.ق')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 font-bold">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-gray-700">
                      {t('accounting.totals', 'الإجماليات')}
                    </td>
                    <td className="px-4 py-3 text-green-600 bg-green-50">
                      {Number(totalDebit).toFixed(2)} {t('common.qar', 'ر.ق')}
                    </td>
                    <td className="px-4 py-3 text-red-600 bg-red-50">
                      {Number(totalCredit).toFixed(2)} {t('common.qar', 'ر.ق')}
                    </td>
                    <td className={cn(
                      "px-4 py-3 bg-purple-50",
                      currentBalance >= 0 ? "text-purple-600" : "text-red-600"
                    )}>
                      {Number(currentBalance).toFixed(2)} {t('common.qar', 'ر.ق')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
