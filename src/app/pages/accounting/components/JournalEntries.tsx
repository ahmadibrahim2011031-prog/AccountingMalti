'use client'

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/utils/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/pages/components/card'
import { Button } from '@/app/pages/components/button'
import { Input } from '@/app/pages/components/input'
import { Label } from '@/app/pages/components/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/pages/components/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/pages/components/tabs'
import { toast } from 'sonner'
import {
  Plus, Trash2, Calendar, DollarSign, TrendingUp, TrendingDown,
  Receipt, FileText, ArrowDownCircle, ArrowUpCircle, Edit, Search, Eye, Upload
} from 'lucide-react'
import { cn } from '@/utils/utils'

interface AssetAccount {
  id: string
  accountNumber: string
  name: string
  nameAr?: string
  balance: number
}

interface Account {
  id: string
  accountNumber: string
  name: string
  nameAr?: string
  type: string
}

interface JournalEntry {
  documentUrl?: string
  id: string
  journalNumber: string
  date: string
  description: string
  totalAmount: number
  details: {
    id: string
    account: Account
    debit: number
    credit: number
  }[]
}

export function JournalEntries() {
  const { t, language } = useLanguage()
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingEntry, setIsAddingEntry] = useState(false)
  const [isEditingEntry, setIsEditingEntry] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null)

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Helper function to format date with Western numerals (force 0-9 digits)
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    // Use U+200E (LRM - Left-to-Right Mark) to prevent numeral conversion
    // This forces each digit to maintain its Latin form
    return `\u200E${day}\u200E/\u200E${month}\u200E/\u200E${year}\u200E`
  }

  const [entryForm, setEntryForm] = useState({
    date: getTodayDate(),
    description: '',
    amount: '',
    debitAccountId: '',
    creditAccountId: ''
  })

  const [editForm, setEditForm] = useState({
    date: getTodayDate(),
    description: '',
    amount: '',
    debitAccountId: '',
    creditAccountId: '',
    documentUrl: ''
  })

  // Filter journal entries based on search query
  const filteredEntries = journalEntries.filter(entry => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()

    // Search in entry number
    if (entry.journalNumber && entry.journalNumber.toLowerCase().includes(query)) return true

    // Search in description
    if (entry.description && entry.description.toLowerCase().includes(query)) return true

    // Search in account names
    const hasAccountMatch = entry.details.some(detail => {
      const accountName = detail.account.name?.toLowerCase() || ''
      const accountNameAr = detail.account.nameAr?.toLowerCase() || ''
      const accountNumber = detail.account.accountNumber?.toLowerCase() || ''

      return accountName.includes(query) || accountNameAr.includes(query) || accountNumber.includes(query)
    })

    if (hasAccountMatch) return true

    return false
  })

  useEffect(() => {
    // Set default date range to last 12 months to show all entries
    const now = new Date()
    const firstDay = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setDateFrom(firstDay.toISOString().split('T')[0])
    setDateTo(lastDay.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchData()
    }
  }, [dateFrom, dateTo])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch journal entries
      const entriesUrl = `/api/accounting?type=journal-entries&dateFrom=${dateFrom}&dateTo=${dateTo}`
      console.log('Fetching entries with date range:', { dateFrom, dateTo }, 'URL:', entriesUrl)
      const entriesRes = await fetch(entriesUrl)
      if (!entriesRes.ok) {
        const error = await entriesRes.json()
        console.error('Failed to fetch entries:', error)
        throw new Error('Failed to fetch entries')
      }
      const entriesData = await entriesRes.json()
      console.log('Fetched entries count:', entriesData.entries?.length || 0)
      console.log('Sample entry date format:', entriesData.entries?.[0]?.date)

      // Show ALL journal entries (not just revenue/expense)
      setJournalEntries(entriesData.entries || [])

      // Fetch ALL accounts from chart of accounts (Balance Sheet + P&L)
      const accountsRes = await fetch('/api/accounting?type=all-accounts')
      if (!accountsRes.ok) throw new Error('Failed to fetch accounts')
      const accountsData = await accountsRes.json()
      setAllAccounts(accountsData.accounts || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error(t('accounting.fetchError', 'فشل في جلب البيانات'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddJournalEntry = async () => {
    try {
      // Validate date
      if (!entryForm.date) {
        toast.error(t('accounting.dateRequired', 'الرجاء اختيار التاريخ'))
        return
      }

      // Validate amount
      const amount = parseFloat(entryForm.amount)
      if (!entryForm.amount || isNaN(amount) || amount <= 0) {
        toast.error(t('accounting.invalidAmount', 'الرجاء إدخال مبلغ صحيح'))
        return
      }

      // Validate debit account
      if (!entryForm.debitAccountId) {
        toast.error(t('accounting.selectDebitAccount', 'الرجاء اختيار حساب المدين'))
        return
      }

      // Validate credit account
      if (!entryForm.creditAccountId) {
        toast.error(t('accounting.selectCreditAccount', 'الرجاء اختيار حساب الدائن'))
        return
      }

      // Validate accounts are different
      if (entryForm.debitAccountId === entryForm.creditAccountId) {
        toast.error(t('accounting.sameAccountError', 'لا يمكن أن يكون حساب المدين والدائن متطابقين'))
        return
      }

      // Validate description
      if (!entryForm.description.trim()) {
        toast.error(t('accounting.descriptionRequired', 'الرجاء إدخال وصف القيد'))
        return
      }

      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createJournalEntry',
          data: {
            date: entryForm.date,
            description: entryForm.description,
            amount: amount,
            debitAccountId: entryForm.debitAccountId,
            creditAccountId: entryForm.creditAccountId
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create journal entry')
      }

      const result = await response.json()
      console.log('Journal entry created:', result)

      // Upload document if one was selected
      if (uploadedDocument && result.journalEntry) {
        try {
          const formData = new FormData()
          formData.append('entryId', result.journalEntry.id)
          formData.append('document', uploadedDocument)

          const uploadResponse = await fetch('/api/accounting?action=uploadDocument', {
            method: 'POST',
            body: formData
          })

          if (!uploadResponse.ok) {
            console.error('Failed to upload document')
            toast.error(t('accounting.documentUploadFailed', 'فشل في رفع المستند'))
          } else {
            console.log('Document uploaded successfully')
          }
        } catch (uploadError) {
          console.error('Error uploading document:', uploadError)
        }
      }

      toast.success(t('accounting.journalEntryCreated', 'تم إنشاء القيد اليومية بنجاح'))

      // Reset form with current date
      setEntryForm({
        date: getTodayDate(),
        description: '',
        amount: '',
        debitAccountId: '',
        creditAccountId: ''
      })
      setUploadedDocument(null)

      // Close modal first
      setIsAddingEntry(false)

      // Refresh data after a short delay to ensure DB has committed
      setTimeout(() => {
        fetchData()
      }, 1000)
    } catch (error) {
      console.error('Error creating journal entry:', error)
      toast.error(t('accounting.createError', 'فشل في إنشاء القيد'))
    }
  }

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry)

    // Find debit and credit accounts from details
    const debitDetail = entry.details.find(d => d.debit > 0)
    const creditDetail = entry.details.find(d => d.credit > 0)

    setEditForm({
      date: entry.date.split('T')[0], // Format date as YYYY-MM-DD
      description: entry.description,
      amount: (debitDetail?.debit || creditDetail?.credit || 0).toString(),
      debitAccountId: debitDetail?.account.id || '',
      creditAccountId: creditDetail?.account.id || '',
      documentUrl: entry.documentUrl || ''
    })

    setIsEditingEntry(true)
  }

  const handleUpdateEntry = async () => {
    if (!editingEntry) return

    try {
      // Validate amount
      const amount = parseFloat(editForm.amount)
      if (!editForm.amount || isNaN(amount) || amount <= 0) {
        toast.error(t('accounting.invalidAmount', 'الرجاء إدخال مبلغ صحيح'))
        return
      }

      // Validate accounts
      if (!editForm.debitAccountId || !editForm.creditAccountId) {
        toast.error(t('accounting.selectAccounts', 'الرجاء اختيار الحسابات'))
        return
      }

      if (editForm.debitAccountId === editForm.creditAccountId) {
        toast.error(t('accounting.sameAccountError', 'لا يمكن أن يكون حساب المدين والدائن متطابقين'))
        return
      }

      if (!editForm.description.trim()) {
        toast.error(t('accounting.descriptionRequired', 'الرجاء إدخال وصف القيد'))
        return
      }

      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateJournalEntry',
          data: {
            id: editingEntry.id,
            date: editForm.date,
            description: editForm.description,
            amount: amount,
            debitAccountId: editForm.debitAccountId,
            creditAccountId: editForm.creditAccountId,
            documentUrl: editForm.documentUrl || null
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update journal entry')
      }

      const result = await response.json()

      // Upload document if one was selected
      if (uploadedDocument) {
        try {
          const formData = new FormData()
          formData.append('entryId', editingEntry.id)
          formData.append('document', uploadedDocument)

          const uploadResponse = await fetch('/api/accounting?action=uploadDocument', {
            method: 'POST',
            body: formData
          })

          if (!uploadResponse.ok) {
            console.error('Failed to upload document')
            toast.error(t('accounting.documentUploadFailed', 'فشل في رفع المستند'))
          } else {
            console.log('Document uploaded successfully')
          }
        } catch (uploadError) {
          console.error('Error uploading document:', uploadError)
        }
      }

      toast.success(t('accounting.journalEntryUpdated', 'تم تحديث القيد بنجاح'))
      setIsEditingEntry(false)
      setEditingEntry(null)
      fetchData()
    } catch (error) {
      console.error('Error updating journal entry:', error)
      toast.error(t('accounting.updateError', 'فشل في تحديث القيد'))
    }
  }

  const handleDeleteTransaction = async (entryId: string) => {
    if (!confirm(t('accounting.confirmDelete', 'هل أنت متأكد من حذف هذه المعاملة؟'))) {
      return
    }

    try {
      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteJournalEntry',
          data: { id: entryId }
        })
      })

      if (!response.ok) throw new Error('Failed to delete transaction')

      toast.success(t('accounting.transactionDeleted', 'تم حذف المعاملة بنجاح'))
      fetchData()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error(t('accounting.deleteError', 'فشل في حذف المعاملة'))
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    let totalRevenue = 0
    let totalExpenses = 0

    journalEntries.forEach(entry => {
      entry.details.forEach(detail => {
        if (detail.account.type === 'REVENUE') {
          totalRevenue += detail.credit
        } else if (detail.account.type === 'EXPENSE') {
          totalExpenses += detail.debit
        }
      })
    })

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netProfit: totalRevenue - totalExpenses
    }
  }

  // Group entries by category
  const groupedEntries = journalEntries.reduce((acc, entry) => {
    entry.details.forEach(detail => {
      if (detail.account.type === 'REVENUE' || detail.account.type === 'EXPENSE') {
        const category = detail.account.nameAr || detail.account.name
        const amount = detail.account.type === 'EXPENSE' ? detail.debit : detail.credit

        if (!acc[category]) {
          acc[category] = {
            category,
            type: detail.account.type,
            total: 0,
            entries: []
          }
        }

        acc[category].total += amount
        acc[category].entries.push({
          ...entry,
          amount,
          assetAccount: entry.details.find(d => d.account.type === 'ASSET')?.account
        })
      }
    })
    return acc
  }, {} as Record<string, any>)

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card className="border-2 border-purple-500">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('accounting.dateRange', 'الفترة الزمنية')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </CardContent>
      </Card>

      {/* Search and Add Entry */}
      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="flex-1 max-w-md">
          <Label>{t('accounting.search', 'بحث')}</Label>
          <Input
            type="text"
            placeholder={t('accounting.searchPlaceholder', 'ابحث في القيود (رقم القيد، الوصف، الحساب)...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button
          onClick={() => setIsAddingEntry(true)}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Plus className="w-5 h-5 ml-2" />
          {t('accounting.addJournalEntry', 'إضافة قيد يومية')}
        </Button>
      </div>

      {/* Transactions Log */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {t('accounting.transactionLog', 'سجل المعاملات')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('accounting.date', 'التاريخ')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('accounting.journalNumber', 'رقم القيد')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('accounting.description', 'الوصف')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('accounting.debitAccount', 'حساب المدين')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('accounting.creditAccount', 'حساب الدائن')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('accounting.amount', 'المبلغ')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('common.actions', 'الإجراءات')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      {searchQuery ? t('accounting.noSearchResults', 'لا توجد نتائج للبحث') : t('accounting.noTransactions', 'لا توجد معاملات')}
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    // Find debit and credit details
                    const debitDetail = entry.details.find(d => Number(d.debit) > 0)
                    const creditDetail = entry.details.find(d => Number(d.credit) > 0)

                    if (!debitDetail || !creditDetail) return null

                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                          {entry.journalNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              {language === 'ar' && debitDetail.account.nameAr
                                ? debitDetail.account.nameAr
                                : debitDetail.account.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                              {language === 'ar' && creditDetail.account.nameAr
                                ? creditDetail.account.nameAr
                                : creditDetail.account.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold">
                          {'\u200E'}{Number(entry.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{'\u200E'} {t('common.qar', 'ر.ق')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditEntry(entry)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {entry.documentUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(entry.documentUrl, '_blank')}
                                className="text-green-600 hover:text-green-700"
                                title={t('accounting.viewDocument', 'عرض المستند')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTransaction(entry.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Journal Entry Dialog */}
      <Dialog open={isAddingEntry} onOpenChange={setIsAddingEntry}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t('accounting.addNewJournalEntry', 'إضافة قيد يومية جديد')}</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {t('accounting.doubleEntryInfo', 'كل قيد يجب أن يحتوي على مدين ودائن متساويين')}
            </p>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* Date and Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">{t('accounting.entryDate', 'تاريخ القيد')} *</Label>
                <Input
                  type="date"
                  value={entryForm.date}
                  onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                  max="2099-12-31"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">{t('accounting.amount', 'المبلغ')} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={entryForm.amount}
                  onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                  className="mt-1 font-mono"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-semibold">{t('accounting.description', 'وصف')} *</Label>
              <Input
                placeholder={t('accounting.entryDescription', 'وصف القيد (مثال: شراء معدات مكتبية)')}
                value={entryForm.description}
                onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            {/* Double-Entry Section */}
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('accounting.doubleEntryAccounts', 'حسابات القيد المزدوج')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Debit Account */}
                <div className="bg-white p-3 rounded-md border border-green-300">
                  <Label className="text-sm font-semibold text-green-700 flex items-center gap-1">
                    <ArrowDownCircle className="w-4 h-4" />
                    {t('accounting.debitAccount', 'حساب المدين')} *
                  </Label>
                  <select
                    className="w-full mt-2 px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50"
                    value={entryForm.debitAccountId}
                    onChange={(e) => setEntryForm({ ...entryForm, debitAccountId: e.target.value })}
                    required
                  >
                    <option value="">{t('accounting.selectDebitAccount', 'اختر حساب المدين')}</option>

                    {/* Group accounts by type */}
                    <optgroup label={language === 'ar' ? 'الأصول (ASSET)' : 'Assets (ASSET)'}>
                      {allAccounts.filter(acc => acc.type === 'ASSET').map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label={language === 'ar' ? 'الالتزامات (LIABILITY)' : 'Liabilities (LIABILITY)'}>
                      {allAccounts.filter(acc => acc.type === 'LIABILITY').map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label={language === 'ar' ? 'حقوق الملكية (EQUITY)' : 'Equity (EQUITY)'}>
                      {allAccounts.filter(acc => acc.type === 'EQUITY').map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label={language === 'ar' ? 'الإيرادات (REVENUE)' : 'Revenue (REVENUE)'}>
                      {allAccounts.filter(acc => acc.type === 'REVENUE').map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label={language === 'ar' ? 'المصروفات (EXPENSE)' : 'Expenses (EXPENSE)'}>
                      {allAccounts.filter(acc => acc.type === 'EXPENSE').map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Credit Account */}
                <div className="bg-white p-3 rounded-md border border-red-300">
                  <Label className="text-sm font-semibold text-red-700 flex items-center gap-1">
                    <ArrowUpCircle className="w-4 h-4" />
                    {t('accounting.creditAccount', 'حساب الدائن')} *
                  </Label>
                  <select
                    className="w-full mt-2 px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                    value={entryForm.creditAccountId}
                    onChange={(e) => setEntryForm({ ...entryForm, creditAccountId: e.target.value })}
                    required
                  >
                    <option value="">{t('accounting.selectCreditAccount', 'اختر حساب الدائن')}</option>

                    {/* Group accounts by type */}
                    <optgroup label={language === 'ar' ? 'الأصول (ASSET)' : 'Assets (ASSET)'}>
                      {allAccounts.filter(acc => acc.type === 'ASSET').map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label={language === 'ar' ? 'الالتزامات (LIABILITY)' : 'Liabilities (LIABILITY)'}>
                      {allAccounts.filter(acc => acc.type === 'LIABILITY').map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label={language === 'ar' ? 'حقوق الملكية (EQUITY)' : 'Equity (EQUITY)'}>
                      {allAccounts.filter(acc => acc.type === 'EQUITY').map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label={language === 'ar' ? 'الإيرادات (REVENUE)' : 'Revenue (REVENUE)'}>
                      {allAccounts.filter(acc => acc.type === 'REVENUE').map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label={language === 'ar' ? 'المصروفات (EXPENSE)' : 'Expenses (EXPENSE)'}>
                      {allAccounts.filter(acc => acc.type === 'EXPENSE').map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <p className="text-xs text-blue-700 mt-2 text-center">
                {t('accounting.debitCreditRule', 'المدين = الدائن (يجب أن يكونا متساويين)')}
              </p>
            </div>

            {/* Document Upload */}
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                {t('accounting.attachDocument', 'إرفاق مستند')} ({t('common.optional', 'اختياري')})
              </Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setUploadedDocument(e.target.files?.[0] || null)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('accounting.supportedFormats', 'الصيغ المدعومة: PDF, JPG, PNG, DOC, DOCX')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingEntry(false)}>
              {t('common.cancel', 'إلغاء')}
            </Button>
            <Button onClick={handleAddJournalEntry} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 ml-2" />
              {t('common.save', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Journal Entry Dialog */}
      <Dialog open={isEditingEntry} onOpenChange={setIsEditingEntry}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t('accounting.editJournalEntry', 'تعديل قيد يومية')}</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {t('accounting.doubleEntryInfo', 'كل قيد يجب أن يحتوي على مدين ودائن متساويين')}
            </p>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            {/* Date and Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">{t('accounting.entryDate', 'تاريخ القيد')} *</Label>
                <Input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  max="2099-12-31"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">{t('accounting.amount', 'المبلغ')} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-semibold">{t('accounting.description', 'الوصف')} *</Label>
              <Input
                type="text"
                placeholder={t('accounting.descriptionPlaceholder', 'وصف القيد')}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Debit Account */}
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-green-600" />
                {t('accounting.debitAccount', 'حساب المدين')} *
              </Label>
              <select
                value={editForm.debitAccountId}
                onChange={(e) => setEditForm({ ...editForm, debitAccountId: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">{t('accounting.selectDebitAccount', 'اختر حساب المدين')}</option>

                <optgroup label={language === 'ar' ? 'الأصول (ASSET)' : 'Assets (ASSET)'}>
                  {allAccounts.filter(acc => acc.type === 'ASSET').map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label={language === 'ar' ? 'الالتزامات (LIABILITY)' : 'Liabilities (LIABILITY)'}>
                  {allAccounts.filter(acc => acc.type === 'LIABILITY').map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label={language === 'ar' ? 'حقوق الملكية (EQUITY)' : 'Equity (EQUITY)'}>
                  {allAccounts.filter(acc => acc.type === 'EQUITY').map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label={language === 'ar' ? 'الإيرادات (REVENUE)' : 'Revenue (REVENUE)'}>
                  {allAccounts.filter(acc => acc.type === 'REVENUE').map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label={language === 'ar' ? 'المصروفات (EXPENSE)' : 'Expenses (EXPENSE)'}>
                  {allAccounts.filter(acc => acc.type === 'EXPENSE').map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Credit Account */}
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-red-600" />
                {t('accounting.creditAccount', 'حساب الدائن')} *
              </Label>
              <select
                value={editForm.creditAccountId}
                onChange={(e) => setEditForm({ ...editForm, creditAccountId: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">{t('accounting.selectCreditAccount', 'اختر حساب الدائن')}</option>

                <optgroup label={language === 'ar' ? 'الأصول (ASSET)' : 'Assets (ASSET)'}>
                  {allAccounts.filter(acc => acc.type === 'ASSET').map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label={language === 'ar' ? 'الالتزامات (LIABILITY)' : 'Liabilities (LIABILITY)'}>
                  {allAccounts.filter(acc => acc.type === 'LIABILITY').map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label={language === 'ar' ? 'حقوق الملكية (EQUITY)' : 'Equity (EQUITY)'}>
                  {allAccounts.filter(acc => acc.type === 'EQUITY').map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label={language === 'ar' ? 'الإيرادات (REVENUE)' : 'Revenue (REVENUE)'}>
                  {allAccounts.filter(acc => acc.type === 'REVENUE').map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label={language === 'ar' ? 'المصروفات (EXPENSE)' : 'Expenses (EXPENSE)'}>
                  {allAccounts.filter(acc => acc.type === 'EXPENSE').map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} - {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            {/* Document Upload */}
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                {t('accounting.attachDocument', 'إرفاق مستند')} ({t('common.optional', 'اختياري')})
              </Label>
              {editForm.documentUrl && (
                <div className="mt-2 mb-2 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Eye className="w-4 h-4" />
                    <a href={editForm.documentUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">
                      {t('accounting.viewCurrentDocument', 'عرض المستند الحالي')}
                    </a>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(t('accounting.confirmRemoveDocument', 'هل أنت متأكد من حذف المستند؟'))) {
                        setEditForm({ ...editForm, documentUrl: '' })
                        setUploadedDocument(null)
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setUploadedDocument(e.target.files?.[0] || null)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('accounting.supportedFormats', 'الصيغ المدعومة: PDF, JPG, PNG, DOC, DOCX')}
                {editForm.documentUrl && <span className="ml-2">• {t('accounting.uploadNewToReplace', 'ارفع مستند جديد للاستبدال')}</span>}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingEntry(false)}>
              {t('common.cancel', 'إلغاء')}
            </Button>
            <Button onClick={handleUpdateEntry} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 ml-2" />
              {t('common.save', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
