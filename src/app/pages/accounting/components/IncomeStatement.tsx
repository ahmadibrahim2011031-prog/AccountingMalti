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
  Receipt, FileText, ArrowDownCircle, ArrowUpCircle
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

export function IncomeStatement() {
  const { t, language } = useLanguage()
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [assetAccounts, setAssetAccounts] = useState<AssetAccount[]>([])
  const [expenseCategories, setExpenseCategories] = useState<Account[]>([])
  const [revenueCategories, setRevenueCategories] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const [transactionType, setTransactionType] = useState<'EXPENSE' | 'REVENUE'>('EXPENSE')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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

  const [transactionForm, setTransactionForm] = useState({
    date: getTodayDate(),
    categoryId: '',
    categoryName: '',
    amount: '',
    assetAccountId: '',
    description: ''
  })

  useEffect(() => {
    // Set default date range to current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
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

      // Filter entries to only show those with revenue/expense accounts
      const filteredEntries = (entriesData.entries || []).filter((entry: JournalEntry) => {
        return entry.details.some(d => d.account.type === 'REVENUE' || d.account.type === 'EXPENSE')
      })
      console.log('Filtered entries:', filteredEntries)

      setJournalEntries(filteredEntries)

      // Fetch asset accounts
      const assetsRes = await fetch('/api/accounting?type=asset-accounts')
      if (!assetsRes.ok) throw new Error('Failed to fetch asset accounts')
      const assetsData = await assetsRes.json()
      setAssetAccounts(assetsData.accounts || [])

      // Fetch expense/revenue categories
      const categoriesRes = await fetch(`/api/accounting?type=income-statement&dateFrom=${dateFrom}&dateTo=${dateTo}`)
      if (!categoriesRes.ok) throw new Error('Failed to fetch categories')
      const categoriesData = await categoriesRes.json()

      const expenses = categoriesData.accounts?.filter((a: Account) => a.type === 'EXPENSE') || []
      const revenues = categoriesData.accounts?.filter((a: Account) => a.type === 'REVENUE') || []

      setExpenseCategories(expenses)
      setRevenueCategories(revenues)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error(t('accounting.fetchError', 'فشل في جلب البيانات'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = async () => {
    try {
      // Validate date
      if (!transactionForm.date) {
        toast.error(t('accounting.dateRequired', 'الرجاء اختيار التاريخ'))
        return
      }

      // Validate amount
      const amount = parseFloat(transactionForm.amount)
      if (!transactionForm.amount || isNaN(amount) || amount <= 0) {
        toast.error(t('accounting.invalidAmount', 'الرجاء إدخال مبلغ صحيح'))
        return
      }

      // Validate asset account
      if (!transactionForm.assetAccountId) {
        toast.error(t('accounting.selectAssetAccount', 'الرجاء اختيار حساب الأصل'))
        return
      }

      // Validate category
      if (!transactionForm.categoryId && !transactionForm.categoryName) {
        toast.error(t('accounting.selectCategory', 'الرجاء اختيار أو إدخال فئة'))
        return
      }

      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createTransaction',
          data: {
            date: transactionForm.date,
            transactionType,
            categoryId: transactionForm.categoryId || null,
            categoryName: transactionForm.categoryName || null,
            amount: amount,
            assetAccountId: transactionForm.assetAccountId,
            description: transactionForm.description || ''
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create transaction')
      }

      const result = await response.json()
      console.log('Transaction created:', result)

      toast.success(t('accounting.transactionCreated', 'تم إنشاء المعاملة بنجاح'))

      // Reset form with current date
      setTransactionForm({
        date: getTodayDate(),
        categoryId: '',
        categoryName: '',
        amount: '',
        assetAccountId: '',
        description: ''
      })

      // Close modal first
      setIsAddingTransaction(false)

      // Refresh data after a short delay to ensure DB has committed
      console.log('Transaction created successfully, refreshing data in 1 second...')
      setTimeout(() => {
        console.log('Refreshing journal entries after transaction creation')
        fetchData()
      }, 1000)
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error(t('accounting.createError', 'فشل في إنشاء المعاملة'))
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

  const totals = calculateTotals()
  const isProfitable = totals.netProfit >= 0

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

  const categories = expenseCategories.concat(revenueCategories)

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

      {/* Net Profit/Loss Summary */}
      <Card className={cn(
        "border-2",
        isProfitable ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isProfitable ? (
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="p-2 bg-red-500 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">
                  {isProfitable ? t('accounting.netProfit', 'صافي الربح') : t('accounting.netLoss', 'صافي الخسارة')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('accounting.profitFormula', 'الإيرادات - المصروفات')}
                </p>
              </div>
            </div>

            <div className="text-left">
              <div className={cn(
                "text-3xl font-bold",
                isProfitable ? "text-green-600" : "text-red-600"
              )}>
                {Number(Math.abs(totals.netProfit)).toFixed(2)} {t('common.qar', 'ر.ق')}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {t('accounting.revenue', 'الإيرادات')}: {Number(totals.revenue).toFixed(2)} {t('common.qar', 'ر.ق')}
              </div>
              <div className="text-sm text-gray-600">
                {t('accounting.expenses', 'المصروفات')}: {Number(totals.expenses).toFixed(2)} {t('common.qar', 'ر.ق')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Transaction Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setIsAddingTransaction(true)}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Plus className="w-5 h-5 ml-2" />
          {t('accounting.addTransaction', 'إضافة معاملة')}
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
                    {t('accounting.category', 'الفئة')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('accounting.assetAccount', 'حساب الأصل')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('accounting.amount', 'المبلغ')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('accounting.type', 'النوع')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('accounting.description', 'الوصف')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('common.actions', 'الإجراءات')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {journalEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      {t('accounting.noTransactions', 'لا توجد معاملات')}
                    </td>
                  </tr>
                ) : (
                  journalEntries.map((entry) => {
                    const categoryDetail = entry.details.find(d => d.account.type === 'REVENUE' || d.account.type === 'EXPENSE')
                    const assetDetail = entry.details.find(d => d.account.type === 'ASSET')

                    if (!categoryDetail) return null

                    const isExpense = categoryDetail.account.type === 'EXPENSE'

                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                          {entry.journalNumber}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {language === 'ar' && categoryDetail.account.nameAr
                            ? categoryDetail.account.nameAr
                            : categoryDetail.account.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {assetDetail && (language === 'ar' && assetDetail.account.nameAr
                            ? assetDetail.account.nameAr
                            : assetDetail.account.name)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold">
                          {'\u200E'}{Number(entry.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{'\u200E'} {t('common.qar', 'ر.ق')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isExpense ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <ArrowDownCircle className="w-3 h-3 ml-1" />
                              {t('accounting.expense', 'مصروف')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <ArrowUpCircle className="w-3 h-3 ml-1" />
                              {t('accounting.revenue', 'إيراد')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {isExpense
                            ? `${t('accounting.expense', 'مصروف')}: ${language === 'ar' && categoryDetail.account.nameAr ? categoryDetail.account.nameAr : categoryDetail.account.name}`
                            : `${t('accounting.revenue', 'إيراد')}: ${language === 'ar' && categoryDetail.account.nameAr ? categoryDetail.account.nameAr : categoryDetail.account.name}`
                          }
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTransaction(entry.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Add Transaction Dialog */}
      <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('accounting.addNewTransaction', 'إضافة معاملة جديدة')}</DialogTitle>
          </DialogHeader>

          <Tabs value={transactionType} onValueChange={(v) => setTransactionType(v as 'EXPENSE' | 'REVENUE')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="EXPENSE" className="flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4" />
                {t('accounting.expense', 'مصروف')}
              </TabsTrigger>
              <TabsTrigger value="REVENUE" className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4" />
                {t('accounting.revenue', 'إيراد')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="EXPENSE" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('accounting.transactionDate', 'تاريخ المعاملة')}</Label>
                  <Input
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                    max="2099-12-31"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label>{t('accounting.amount', 'المبلغ')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label>{t('accounting.expenseCategory', 'فئة المصروف')}</Label>
                <select
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={transactionForm.categoryId}
                  onChange={(e) => setTransactionForm({ ...transactionForm, categoryId: e.target.value, categoryName: '' })}
                >
                  <option value="">{t('accounting.selectCategory', 'اختر فئة')}</option>
                  {expenseCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {language === 'ar' && cat.nameAr ? cat.nameAr : cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>{t('accounting.orNewCategory', 'أو أدخل فئة جديدة')}</Label>
                <Input
                  placeholder={t('accounting.newCategoryName', 'اسم الفئة الجديدة')}
                  value={transactionForm.categoryName}
                  onChange={(e) => setTransactionForm({ ...transactionForm, categoryName: e.target.value, categoryId: '' })}
                  disabled={!!transactionForm.categoryId}
                />
              </div>

              <div>
                <Label>{t('accounting.paidFromAccount', 'دفع من حساب')}</Label>
                <select
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={transactionForm.assetAccountId}
                  onChange={(e) => setTransactionForm({ ...transactionForm, assetAccountId: e.target.value })}
                >
                  <option value="">{t('accounting.selectAssetAccount', 'اختر حساب الأصل')}</option>
                  {assetAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name} ({Number(acc.balance).toFixed(2)} {t('common.qar', 'ر.ق')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>{t('accounting.description', 'وصف') + ' (' + t('common.optional', 'اختياري') + ')'}</Label>
                <Input
                  placeholder={t('accounting.transactionDescription', 'وصف المعاملة')}
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="REVENUE" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('accounting.transactionDate', 'تاريخ المعاملة')}</Label>
                  <Input
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                    max="2099-12-31"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label>{t('accounting.amount', 'المبلغ')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label>{t('accounting.revenueCategory', 'فئة الإيراد')}</Label>
                <select
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={transactionForm.categoryId}
                  onChange={(e) => setTransactionForm({ ...transactionForm, categoryId: e.target.value, categoryName: '' })}
                >
                  <option value="">{t('accounting.selectCategory', 'اختر فئة')}</option>
                  {revenueCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {language === 'ar' && cat.nameAr ? cat.nameAr : cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>{t('accounting.orNewCategory', 'أو أدخل فئة جديدة')}</Label>
                <Input
                  placeholder={t('accounting.newCategoryName', 'اسم الفئة الجديدة')}
                  value={transactionForm.categoryName}
                  onChange={(e) => setTransactionForm({ ...transactionForm, categoryName: e.target.value, categoryId: '' })}
                  disabled={!!transactionForm.categoryId}
                />
              </div>

              <div>
                <Label>{t('accounting.receivedToAccount', 'استلام إلى حساب')}</Label>
                <select
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={transactionForm.assetAccountId}
                  onChange={(e) => setTransactionForm({ ...transactionForm, assetAccountId: e.target.value })}
                >
                  <option value="">{t('accounting.selectAssetAccount', 'اختر حساب الأصل')}</option>
                  {assetAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {language === 'ar' && acc.nameAr ? acc.nameAr : acc.name} ({Number(acc.balance).toFixed(2)} {t('common.qar', 'ر.ق')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>{t('accounting.description', 'وصف') + ' (' + t('common.optional', 'اختياري') + ')'}</Label>
                <Input
                  placeholder={t('accounting.transactionDescription', 'وصف المعاملة')}
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTransaction(false)}>
              {t('common.cancel', 'إلغاء')}
            </Button>
            <Button onClick={handleAddTransaction} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 ml-2" />
              {t('common.save', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
