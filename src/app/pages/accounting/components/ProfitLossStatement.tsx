'use client'

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/utils/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/pages/components/card'
import { Input } from '@/app/pages/components/input'
import { Label } from '@/app/pages/components/label'
import { Button } from '@/app/pages/components/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/pages/components/dialog'
import { toast } from 'sonner'
import {
  TrendingUp, TrendingDown, Calendar, DollarSign, FileText,
  Download, Printer, ArrowUpCircle, ArrowDownCircle, Plus, X, Save, Edit, Trash2
} from 'lucide-react'
import { cn } from '@/utils/utils'

interface AccountBalance {
  id: string
  accountNumber: string
  name: string
  nameAr?: string
  balance: number
  type: string
  expenseClassification?: string
}

interface ProfitLossData {
  revenue: {
    accounts: AccountBalance[]
    total: number
  }
  expenses: {
    operational: AccountBalance[]
    administrative: AccountBalance[]
    marketing: AccountBalance[]
    financing: AccountBalance[]
    other: AccountBalance[]
    total: number
  }
  netProfit: number
}

export function ProfitLossStatement() {
  const { t, language } = useLanguage()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [isEditingAccount, setIsEditingAccount] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountBalance | null>(null)
  const [newAccountData, setNewAccountData] = useState({
    name: '',
    nameAr: '',
    accountNumber: '',
    type: 'EXPENSE' as 'EXPENSE' | 'REVENUE',
    expenseClassification: 'OPERATIONAL' as 'OPERATIONAL' | 'ADMINISTRATIVE' | 'MARKETING' | 'FINANCING' | 'UNCLASSIFIED'
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    nameAr: '',
    accountNumber: '',
    expenseClassification: 'OPERATIONAL' as 'OPERATIONAL' | 'ADMINISTRATIVE' | 'MARKETING' | 'UNCLASSIFIED'
  })
  const [data, setData] = useState<ProfitLossData>({
    revenue: { accounts: [], total: 0 },
    expenses: {
      operational: [],
      administrative: [],
      marketing: [],
      financing: [],
      other: [],
      total: 0
    },
    netProfit: 0
  })

  useEffect(() => {
    // Set default date range to last 12 months to show all data
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

      // Fetch all accounts with balances for the date range
      const response = await fetch(
        `/api/accounting?type=income-statement&dateFrom=${dateFrom}&dateTo=${dateTo}`
      )

      if (!response.ok) throw new Error('Failed to fetch data')

      const result = await response.json()
      const accounts = result.accounts || []

      // Separate revenue and expense accounts
      const revenueAccounts = accounts.filter((acc: AccountBalance) => acc.type === 'REVENUE')
      const expenseAccounts = accounts.filter((acc: AccountBalance) => acc.type === 'EXPENSE')

      // Group expenses by classification
      const operational = expenseAccounts.filter((acc: AccountBalance) =>
        acc.expenseClassification === 'OPERATIONAL'
      )
      const administrative = expenseAccounts.filter((acc: AccountBalance) =>
        acc.expenseClassification === 'ADMINISTRATIVE'
      )
      const marketing = expenseAccounts.filter((acc: AccountBalance) =>
        acc.expenseClassification === 'MARKETING'
      )
      const financing = expenseAccounts.filter((acc: AccountBalance) =>
        acc.expenseClassification === 'FINANCING'
      )
      const other = expenseAccounts.filter((acc: AccountBalance) =>
        !acc.expenseClassification || acc.expenseClassification === 'UNCLASSIFIED'
      )

      // Calculate totals
      const revenueTotal = revenueAccounts.reduce((sum: number, acc: AccountBalance) =>
        sum + acc.balance, 0
      )
      const expenseTotal = expenseAccounts.reduce((sum: number, acc: AccountBalance) =>
        sum + acc.balance, 0
      )

      setData({
        revenue: {
          accounts: revenueAccounts,
          total: revenueTotal
        },
        expenses: {
          operational,
          administrative,
          marketing,
          financing,
          other,
          total: expenseTotal
        },
        netProfit: revenueTotal - expenseTotal
      })
    } catch (error) {
      console.error('Error fetching P&L data:', error)
      toast.error(t('accounting.fetchError', 'فشل في جلب البيانات'))
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = async () => {
    try {
      const { downloadIncomeStatementPDF } = await import('@/utils/pdfGenerator')
      await downloadIncomeStatementPDF(data as any, { from: dateFrom, to: dateTo }, language)
      toast.success(t('accounting.exportSuccess', 'تم التصدير بنجاح'))
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error(t('accounting.exportError', 'فشل التصدير'))
    }
  }

  const handleAddAccount = async () => {
    try {
      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createAccount',
          data: {
            ...newAccountData,
            isPostable: true,
            balance: 0,
            parentId: null,
            category: null
          }
        })
      })

      if (!response.ok) throw new Error('Failed to create account')

      toast.success(t('accounting.accountCreated', 'تم إنشاء الحساب بنجاح'))
      setIsAddingAccount(false)
      setNewAccountData({
        name: '',
        nameAr: '',
        accountNumber: '',
        type: 'EXPENSE',
        expenseClassification: 'OPERATIONAL'
      })
      fetchData()
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error(t('accounting.createError', 'فشل في إنشاء الحساب'))
    }
  }

  const openAddDialog = (type: 'EXPENSE' | 'REVENUE', classification?: string) => {
    setNewAccountData({
      name: '',
      nameAr: '',
      accountNumber: '',
      type,
      expenseClassification: (classification as any) || 'OPERATIONAL'
    })
    setIsAddingAccount(true)
  }

  const openEditDialog = (account: AccountBalance) => {
    setEditingAccount(account)
    setEditFormData({
      name: account.name,
      nameAr: account.nameAr || '',
      accountNumber: account.accountNumber,
      expenseClassification: (account.expenseClassification as any) || ''
    })
    setIsEditingAccount(true)
  }

  const handleUpdateAccount = async () => {
    if (!editingAccount) return

    try {
      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateAccount',
          data: {
            id: editingAccount.id,
            name: editFormData.name,
            nameAr: editFormData.nameAr,
            accountNumber: editFormData.accountNumber,
            expenseClassification: editingAccount.type === 'EXPENSE' ? editFormData.expenseClassification : null
          }
        })
      })

      if (!response.ok) throw new Error('Failed to update account')

      toast.success(t('accounting.accountUpdated', 'تم تحديث الحساب بنجاح'))
      setIsEditingAccount(false)
      setEditingAccount(null)
      fetchData()
    } catch (error) {
      console.error('Error updating account:', error)
      toast.error(t('accounting.updateError', 'فشل في تحديث الحساب'))
    }
  }

  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    if (!confirm(`${t('accounting.confirmDelete', 'هل أنت متأكد من حذف الحساب')} "${accountName}"?`)) {
      return
    }

    try {
      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteAccount',
          data: { id: accountId }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete account')
      }

      toast.success(t('accounting.accountDeleted', 'تم حذف الحساب بنجاح'))
      fetchData()
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error(error instanceof Error ? error.message : t('accounting.deleteError', 'فشل في حذف الحساب'))
    }
  }

  const isProfitable = data.netProfit >= 0

  const AccountRow = ({ account }: { account: AccountBalance }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 text-sm font-mono text-gray-600">
        {account.accountNumber}
      </td>
      <td className="px-4 py-2 text-sm">
        {language === 'ar' && account.nameAr ? account.nameAr : account.name}
      </td>
      <td className="px-4 py-2 text-sm font-semibold text-right">
        {Number(account.balance).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex gap-1 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditDialog(account)}
            className="text-xs h-7 px-2"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteAccount(account.id, language === 'ar' && account.nameAr ? account.nameAr : account.name)}
            className="text-xs h-7 px-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card className="border-2 border-green-500">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('accounting.dateRange', 'الفترة الزمنية')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="flex items-end">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="w-full"
              >
                <Printer className="w-4 h-4 ml-2" />
                {t('common.print', 'طباعة')}
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 ml-2" />
                {t('common.exportPDF', 'تصدير PDF')}
              </Button>
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
                <div className="p-3 bg-green-500 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              ) : (
                <div className="p-3 bg-red-500 rounded-lg">
                  <TrendingDown className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-2xl">
                  {isProfitable
                    ? t('accounting.netProfit', 'صافي الربح')
                    : t('accounting.netLoss', 'صافي الخسارة')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('accounting.period', 'الفترة')}: {new Date(dateFrom).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')} - {new Date(dateTo).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')}
                </p>
              </div>
            </div>

            <div className="text-left">
              <div className={cn(
                "text-4xl font-bold",
                isProfitable ? "text-green-600" : "text-red-600"
              )}>
                {Number(Math.abs(data.netProfit)).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} {t('common.qar', 'ر.ق')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-500">{t('common.loading', 'جاري التحميل...')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-gray-300">
          <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('accounting.profitLossStatement', 'قائمة الأرباح والخسائر')}
            </CardTitle>
            <p className="text-sm opacity-90">
              {t('accounting.period', 'الفترة')}: {new Date(dateFrom).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')} - {new Date(dateTo).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {/* REVENUE SECTION */}
                  <tr className="bg-green-100 border-b-2 border-green-500">
                    <td colSpan={3} className="px-4 py-3">
                      <div className="flex items-center gap-2 font-bold text-green-800 text-lg">
                        <ArrowUpCircle className="w-5 h-5" />
                        {t('accounting.revenue', 'الإيرادات')}
                      </div>
                    </td>
                  </tr>

                  {data.revenue.accounts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-gray-500 text-sm">
                        {t('accounting.noRevenue', 'لا توجد إيرادات')}
                      </td>
                    </tr>
                  ) : (
                    data.revenue.accounts.map((account) => (
                      <AccountRow key={account.id} account={account} />
                    ))
                  )}

                  <tr className="bg-green-50 border-t-2 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-right text-green-800">
                      {t('accounting.totalRevenue', 'إجمالي الإيرادات')}
                    </td>
                    <td className="px-4 py-3 text-right text-green-800">
                      {Number(data.revenue.total).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} {t('common.qar', 'ر.ق')}
                    </td>
                  </tr>

                  {/* Add Revenue Account Button */}
                  <tr className="bg-green-50/50">
                    <td colSpan={3} className="px-4 py-2">
                      <Button
                        size="sm"
                        onClick={() => openAddDialog('REVENUE')}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        {t('accounting.addRevenueAccount', 'إضافة حساب إيراد')}
                      </Button>
                    </td>
                  </tr>

                  {/* EXPENSES SECTION */}
                  <tr className="bg-red-100 border-b-2 border-red-500 border-t-4">
                    <td colSpan={3} className="px-4 py-3">
                      <div className="flex items-center gap-2 font-bold text-red-800 text-lg">
                        <ArrowDownCircle className="w-5 h-5" />
                        {t('accounting.expenses', 'المصروفات')}
                      </div>
                    </td>
                  </tr>

                  {/* Operational Expenses */}
                  <tr className="bg-gray-100">
                    <td colSpan={3} className="px-4 py-2 font-semibold text-gray-700 flex items-center justify-between">
                      <span>{t('accounting.operationalExpenses', 'مصروفات تشغيلية')}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAddDialog('EXPENSE', 'OPERATIONAL')}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 ml-1" />
                        {t('common.add', 'إضافة')}
                      </Button>
                    </td>
                  </tr>
                  {data.expenses.operational.map((account) => (
                    <AccountRow key={account.id} account={account} />
                  ))}

                  {/* Administrative Expenses */}
                  <tr className="bg-gray-100">
                    <td colSpan={3} className="px-4 py-2 font-semibold text-gray-700 flex items-center justify-between">
                      <span>{t('accounting.administrativeExpenses', 'مصروفات إدارية وعمومية')}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAddDialog('EXPENSE', 'ADMINISTRATIVE')}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 ml-1" />
                        {t('common.add', 'إضافة')}
                      </Button>
                    </td>
                  </tr>
                  {data.expenses.administrative.map((account) => (
                    <AccountRow key={account.id} account={account} />
                  ))}

                  {/* Marketing Expenses */}
                  <tr className="bg-gray-100">
                    <td colSpan={3} className="px-4 py-2 font-semibold text-gray-700 flex items-center justify-between">
                      <span>{t('accounting.marketingExpenses', 'مصروفات تسويقية')}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAddDialog('EXPENSE', 'MARKETING')}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 ml-1" />
                        {t('common.add', 'إضافة')}
                      </Button>
                    </td>
                  </tr>
                  {data.expenses.marketing.map((account) => (
                    <AccountRow key={account.id} account={account} />
                  ))}

                  {/* Financing Expenses */}
                  <tr className="bg-gray-100">
                    <td colSpan={3} className="px-4 py-2 font-semibold text-gray-700 flex items-center justify-between">
                      <span>{t('accounting.financingExpenses', 'مصروفات تمويلية')}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAddDialog('EXPENSE', 'FINANCING')}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 ml-1" />
                        {t('common.add', 'إضافة')}
                      </Button>
                    </td>
                  </tr>
                  {data.expenses.financing.map((account) => (
                    <AccountRow key={account.id} account={account} />
                  ))}

                  {/* Other Expenses */}
                  <tr className="bg-gray-100">
                    <td colSpan={3} className="px-4 py-2 font-semibold text-gray-700 flex items-center justify-between">
                      <span>{t('accounting.otherExpenses', 'مصروفات أخرى')}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAddDialog('EXPENSE', 'UNCLASSIFIED')}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 ml-1" />
                        {t('common.add', 'إضافة')}
                      </Button>
                    </td>
                  </tr>
                  {data.expenses.other.map((account) => (
                    <AccountRow key={account.id} account={account} />
                  ))}

                  <tr className="bg-red-50 border-t-2 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-right text-red-800">
                      {t('accounting.totalExpenses', 'إجمالي المصروفات')}
                    </td>
                    <td className="px-4 py-3 text-right text-red-800">
                      {Number(data.expenses.total).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} {t('common.qar', 'ر.ق')}
                    </td>
                  </tr>

                  {/* NET PROFIT/LOSS */}
                  <tr className={cn(
                    "border-t-4 font-bold text-lg",
                    isProfitable ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500"
                  )}>
                    <td colSpan={2} className={cn(
                      "px-4 py-4 text-right",
                      isProfitable ? "text-green-900" : "text-red-900"
                    )}>
                      {isProfitable
                        ? t('accounting.netProfit', 'صافي الربح')
                        : t('accounting.netLoss', 'صافي الخسارة')}
                    </td>
                    <td className={cn(
                      "px-4 py-4 text-right",
                      isProfitable ? "text-green-900" : "text-red-900"
                    )}>
                      {Number(Math.abs(data.netProfit)).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} {t('common.qar', 'ر.ق')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('accounting.totalRevenue', 'إجمالي الإيرادات')}</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {Number(data.revenue.total).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ArrowUpCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('accounting.totalExpenses', 'إجمالي المصروفات')}</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {Number(data.expenses.total).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ArrowDownCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-2",
          isProfitable ? "border-blue-500" : "border-orange-500"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {isProfitable
                    ? t('accounting.netProfit', 'صافي الربح')
                    : t('accounting.netLoss', 'صافي الخسارة')}
                </p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  isProfitable ? "text-blue-600" : "text-orange-600"
                )}>
                  {Number(Math.abs(data.netProfit)).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
              <div className={cn(
                "p-3 rounded-lg",
                isProfitable ? "bg-blue-100" : "bg-orange-100"
              )}>
                <DollarSign className={cn(
                  "w-6 h-6",
                  isProfitable ? "text-blue-600" : "text-orange-600"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Account Dialog */}
      <Dialog open={isAddingAccount} onOpenChange={setIsAddingAccount}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {newAccountData.type === 'REVENUE'
                ? t('accounting.addRevenueAccount', 'إضافة حساب إيراد')
                : t('accounting.addExpenseAccount', 'إضافة حساب مصروف')}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              {t('accounting.balanceFromJournalEntries', 'الرصيد يُحسب تلقائياً من قيود اليومية')}
            </p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('accounting.accountNameAr', 'اسم الحساب بالعربية')}</Label>
              <Input
                value={newAccountData.nameAr}
                onChange={(e) => setNewAccountData({ ...newAccountData, nameAr: e.target.value })}
                placeholder={t('accounting.enterAccountNameAr', 'أدخل اسم الحساب بالعربية')}
              />
            </div>
            <div>
              <Label>{t('accounting.accountNameEn', 'Account Name (English)')}</Label>
              <Input
                value={newAccountData.name}
                onChange={(e) => setNewAccountData({ ...newAccountData, name: e.target.value })}
                placeholder={t('accounting.enterAccountName', 'Enter account name')}
              />
            </div>
            <div>
              <Label>{t('accounting.accountNumber', 'رقم الحساب')}</Label>
              <Input
                value={newAccountData.accountNumber}
                onChange={(e) => setNewAccountData({ ...newAccountData, accountNumber: e.target.value })}
                placeholder={t('accounting.enterAccountNumber', 'أدخل رقم الحساب')}
              />
            </div>
            {newAccountData.type === 'EXPENSE' && (
              <div>
                <Label>{t('accounting.expenseClassification', 'تصنيف المصروف')}</Label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={newAccountData.expenseClassification}
                  onChange={(e) => setNewAccountData({
                    ...newAccountData,
                    expenseClassification: e.target.value as any
                  })}
                >
                  <option value="OPERATIONAL">{t('accounting.operational', 'تشغيلية')}</option>
                  <option value="ADMINISTRATIVE">{t('accounting.administrative', 'إدارية وعمومية')}</option>
                  <option value="MARKETING">{t('accounting.marketing', 'تسويقية')}</option>
                  <option value="FINANCING">{t('accounting.financing', 'تمويلية')}</option>
                  <option value="UNCLASSIFIED">{t('accounting.unclassified', 'غير مصنف')}</option>
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingAccount(false)}>
              <X className="w-4 h-4 ml-2" />
              {t('common.cancel', 'إلغاء')}
            </Button>
            <Button onClick={handleAddAccount} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 ml-2" />
              {t('common.save', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={isEditingAccount} onOpenChange={setIsEditingAccount}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t('accounting.editAccount', 'تعديل الحساب')}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              {t('accounting.balanceFromJournalEntries', 'الرصيد يُحسب تلقائياً من قيود اليومية')}
            </p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('accounting.accountNameAr', 'اسم الحساب بالعربية')}</Label>
              <Input
                value={editFormData.nameAr}
                onChange={(e) => setEditFormData({ ...editFormData, nameAr: e.target.value })}
                placeholder={t('accounting.enterAccountNameAr', 'أدخل اسم الحساب بالعربية')}
              />
            </div>
            <div>
              <Label>{t('accounting.accountNameEn', 'Account Name (English)')}</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder={t('accounting.enterAccountName', 'Enter account name')}
              />
            </div>
            <div>
              <Label>{t('accounting.accountNumber', 'رقم الحساب')}</Label>
              <Input
                value={editFormData.accountNumber}
                onChange={(e) => setEditFormData({ ...editFormData, accountNumber: e.target.value })}
                placeholder={t('accounting.enterAccountNumber', 'أدخل رقم الحساب')}
              />
            </div>
            {editingAccount && editingAccount.type === 'EXPENSE' && (
              <div>
                <Label>{t('accounting.expenseClassification', 'تصنيف المصروف')}</Label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={editFormData.expenseClassification}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    expenseClassification: e.target.value as any
                  })}
                >
                  <option value="OPERATIONAL">{t('accounting.operational', 'تشغيلية')}</option>
                  <option value="ADMINISTRATIVE">{t('accounting.administrative', 'إدارية وعمومية')}</option>
                  <option value="MARKETING">{t('accounting.marketing', 'تسويقية')}</option>
                  <option value="FINANCING">{t('accounting.financing', 'تمويلية')}</option>
                  <option value="">{t('accounting.otherExpenses', 'مصروفات أخرى')}</option>
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingAccount(false)}>
              <X className="w-4 h-4 ml-2" />
              {t('common.cancel', 'إلغاء')}
            </Button>
            <Button onClick={handleUpdateAccount} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 ml-2" />
              {t('common.save', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
