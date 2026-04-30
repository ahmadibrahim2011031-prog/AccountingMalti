'use client'

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/utils/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/pages/components/card'
import { Button } from '@/app/pages/components/button'
import { Input } from '@/app/pages/components/input'
import { Label } from '@/app/pages/components/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/pages/components/dialog'
import { toast } from 'sonner'
import {
  ChevronDown, ChevronRight, Plus, Edit, Trash2, Save, X, DollarSign,
  TrendingUp, TrendingDown, Building, Wallet, FileText
} from 'lucide-react'
import { cn } from '@/utils/utils'

interface Account {
  id: string
  accountNumber: string
  name: string
  nameAr?: string
  type: 'ASSET' | 'LIABILITY' | 'EQUITY'
  category?: string
  parentId?: string
  level: number
  isPostable: boolean
  balance: number
  nature: 'DEBIT' | 'CREDIT'
  isActive: boolean
  children?: Account[]
  isExpanded?: boolean
}

export function BalanceSheet() {
  const { t, language } = useLanguage()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    nameAr: '',
    accountNumber: '',
    balance: 0
  })
  const [newAccountData, setNewAccountData] = useState({
    name: '',
    nameAr: '',
    accountNumber: '',
    type: 'ASSET' as 'ASSET' | 'LIABILITY' | 'EQUITY',
    category: '',
    parentId: '',
    isPostable: true,
    balance: 0
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/accounting?type=balance-sheet')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setAccounts(buildAccountTree(data.accounts || []))
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error(t('accounting.fetchError', 'فشل في جلب البيانات'))
    } finally {
      setLoading(false)
    }
  }

  const buildAccountTree = (flatAccounts: Account[]): Account[] => {
    const accountMap = new Map<string, Account>()
    const rootAccounts: Account[] = []

    // Create a map of all accounts
    flatAccounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [], isExpanded: true })
    })

    // Build the tree structure
    flatAccounts.forEach(account => {
      const acc = accountMap.get(account.id)!
      if (account.parentId) {
        const parent = accountMap.get(account.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(acc)
        }
      } else {
        rootAccounts.push(acc)
      }
    })

    return rootAccounts
  }

  const toggleExpand = (accountId: string) => {
    const updateExpanded = (accs: Account[]): Account[] => {
      return accs.map(acc => {
        if (acc.id === accountId) {
          return { ...acc, isExpanded: !acc.isExpanded }
        }
        if (acc.children) {
          return { ...acc, children: updateExpanded(acc.children) }
        }
        return acc
      })
    }
    setAccounts(updateExpanded(accounts))
  }

  const calculateTotal = (accountType: 'ASSET' | 'LIABILITY' | 'EQUITY'): number => {
    const sumAccounts = (accs: Account[]): number => {
      return accs.reduce((sum, acc) => {
        if (acc.type === accountType && acc.isPostable) {
          sum += Number(acc.balance) || 0
        }
        if (acc.children) {
          sum += sumAccounts(acc.children)
        }
        return sum
      }, 0)
    }
    return sumAccounts(accounts)
  }

  const handleAddAccount = async () => {
    try {
      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createAccount', data: newAccountData })
      })

      if (!response.ok) throw new Error('Failed to create account')

      toast.success(t('accounting.accountCreated', 'تم إنشاء الحساب بنجاح'))
      setIsAddingAccount(false)
      setNewAccountData({
        name: '',
        nameAr: '',
        accountNumber: '',
        type: 'ASSET',
        category: '',
        parentId: '',
        isPostable: true,
        balance: 0
      })
      fetchAccounts()
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error(t('accounting.createError', 'فشل في إنشاء الحساب'))
    }
  }

  const handleUpdateAccount = async (accountId: string) => {
    try {
      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateAccount',
          accountId,
          data: editFormData
        })
      })

      if (!response.ok) throw new Error('Failed to update account')

      toast.success(t('accounting.accountUpdated', 'تم تحديث الحساب بنجاح'))
      setEditingAccount(null)
      setEditFormData({ name: '', nameAr: '', accountNumber: '', balance: 0 })
      fetchAccounts()
    } catch (error) {
      console.error('Error updating account:', error)
      toast.error(t('accounting.updateError', 'فشل في تحديث الحساب'))
    }
  }

  const startEditingAccount = (account: Account) => {
    setEditingAccount(account.id)
    setEditFormData({
      name: account.name,
      nameAr: account.nameAr || '',
      accountNumber: account.accountNumber,
      balance: Number(account.balance) || 0
    })
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm(t('accounting.confirmDelete', 'هل أنت متأكد من حذف هذا الحساب؟'))) {
      return
    }

    try {
      const response = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteAccount', accountId })
      })

      if (!response.ok) throw new Error('Failed to delete account')

      toast.success(t('accounting.accountDeleted', 'تم حذف الحساب بنجاح'))
      fetchAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error(t('accounting.deleteError', 'فشل في حذف الحساب'))
    }
  }

  const renderAccountRow = (account: Account, depth: number = 0) => {
    const hasChildren = account.children && account.children.length > 0
    const displayName = language === 'ar' && account.nameAr ? account.nameAr : account.name

    return (
      <div key={account.id}>
        <div
          className={cn(
            "flex items-center justify-between py-3 px-4 border-b hover:bg-gray-50 transition-colors",
            depth > 0 && "bg-gray-50/50"
          )}
          style={language === 'ar'
            ? { paddingLeft: `${depth * 2}rem` }
            : { paddingRight: `${depth * 2}rem` }
          }
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(account.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {account.isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium",
                  !account.isPostable && "text-lg font-bold text-gray-900"
                )}>
                  {displayName}
                </span>
                <span className="text-xs text-gray-500">
                  ({account.accountNumber})
                </span>
              </div>
              {account.category && (
                <span className="text-xs text-gray-500">{account.category}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {account.isPostable && (
              <span className={cn(
                "w-32 font-semibold text-gray-700",
                language === 'ar' ? "text-right" : "text-left"
              )}>
                {Number(account.balance).toFixed(2)} {t('common.qar', 'ر.ق')}
              </span>
            )}
            {!account.isPostable && hasChildren && (
              <span className={cn(
                "font-bold text-blue-600 w-32",
                language === 'ar' ? "text-right" : "text-left"
              )}>
                {Number(calculateSubtotal(account)).toFixed(2)} {t('common.qar', 'ر.ق')}
              </span>
            )}

            {account.isPostable && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditingAccount(account)}
                  title={t('accounting.editAccount', 'تعديل الحساب')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => handleDeleteAccount(account.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {hasChildren && account.isExpanded && account.children!.map(child =>
          renderAccountRow(child, depth + 1)
        )}
      </div>
    )
  }

  const calculateSubtotal = (account: Account): number => {
    if (!account.children) return Number(account.balance) || 0

    return account.children.reduce((sum, child) => {
      if (child.isPostable) {
        return sum + (Number(child.balance) || 0)
      }
      return sum + calculateSubtotal(child)
    }, account.isPostable ? (Number(account.balance) || 0) : 0)
  }

  const assetAccounts = accounts.filter(a => a.type === 'ASSET')
  const liabilityAccounts = accounts.filter(a => a.type === 'LIABILITY')
  const equityAccounts = accounts.filter(a => a.type === 'EQUITY')

  const totalAssets = calculateTotal('ASSET')
  const totalLiabilities = calculateTotal('LIABILITY')
  const totalEquity = calculateTotal('EQUITY')
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01

  return (
    <div className="space-y-6">
      {/* Balance Equation Status */}
      <Card className={cn(
        "border-2",
        isBalanced ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isBalanced ? (
                <div className="p-2 bg-green-500 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="p-2 bg-red-500 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">
                  {isBalanced ? t('accounting.balanced', 'الميزانية متوازنة') : t('accounting.unbalanced', 'الميزانية غير متوازنة')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('accounting.balanceEquation', 'الأصول = الالتزامات + حقوق الملكية')}
                </p>
              </div>
            </div>

            <div className={language === 'ar' ? "text-right" : "text-left"}>
              <div className="text-sm text-gray-600">{t('accounting.difference', 'الفرق')}</div>
              <div className={cn(
                "text-2xl font-bold",
                isBalanced ? "text-green-600" : "text-red-600"
              )}>
                {Number(Math.abs(totalAssets - totalLiabilitiesAndEquity)).toFixed(2)} {t('common.qar', 'ر.ق')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Balance Sheet */}
      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-2 gap-6",
        language === 'ar' && "lg:flex lg:flex-row-reverse"
      )}>
        {/* ASSETS SIDE */}
        <Card className={cn(
          "border-2 border-blue-500",
          language === 'ar' && "lg:flex-1"
        )}>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                {t('accounting.assets', 'الأصول')}
              </span>
              <span className="text-2xl font-bold">
                {Number(totalAssets).toFixed(2)} {t('common.qar', 'ر.ق')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {assetAccounts.map(account => renderAccountRow(account))}
            </div>

            <div className="p-4 border-t-2 border-blue-500 bg-blue-50">
              <Button
                onClick={() => {
                  setNewAccountData({ ...newAccountData, type: 'ASSET' })
                  setIsAddingAccount(true)
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 ml-2" />
                {t('accounting.addAssetCategory', 'إضافة تصنيف أصول')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* LIABILITIES & EQUITY SIDE */}
        <div className={cn(
          "space-y-6",
          language === 'ar' && "lg:flex-1"
        )}>
          {/* Liabilities */}
          <Card className="border-2 border-red-500">
            <CardHeader className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  {t('accounting.liabilities', 'الالتزامات')}
                </span>
                <span className="text-2xl font-bold">
                  {Number(totalLiabilities).toFixed(2)} {t('common.qar', 'ر.ق')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {liabilityAccounts.map(account => renderAccountRow(account))}
              </div>

              <div className="p-4 border-t-2 border-red-500 bg-red-50">
                <Button
                  onClick={() => {
                    setNewAccountData({ ...newAccountData, type: 'LIABILITY' })
                    setIsAddingAccount(true)
                  }}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  {t('accounting.addLiabilityCategory', 'إضافة تصنيف التزامات')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Equity */}
          <Card className="border-2 border-green-500">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  {t('accounting.equity', 'حقوق الملكية')}
                </span>
                <span className="text-2xl font-bold">
                  {Number(totalEquity).toFixed(2)} {t('common.qar', 'ر.ق')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {equityAccounts.map(account => renderAccountRow(account))}
              </div>

              <div className="p-4 border-t-2 border-green-500 bg-green-50">
                <Button
                  onClick={() => {
                    setNewAccountData({ ...newAccountData, type: 'EQUITY' })
                    setIsAddingAccount(true)
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  {t('accounting.addEquityCategory', 'إضافة تصنيف حقوق ملكية')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Account Dialog */}
      <Dialog open={isAddingAccount} onOpenChange={setIsAddingAccount}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('accounting.addNewAccount', 'إضافة حساب جديد')}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('accounting.accountNameAr', 'اسم الحساب بالعربية')}</Label>
              <Input
                value={newAccountData.nameAr}
                onChange={(e) => setNewAccountData({ ...newAccountData, nameAr: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('accounting.accountNameEn', 'Account Name (English)')}</Label>
              <Input
                value={newAccountData.name}
                onChange={(e) => setNewAccountData({ ...newAccountData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('accounting.accountNumber', 'رقم الحساب')}</Label>
              <Input
                value={newAccountData.accountNumber}
                onChange={(e) => setNewAccountData({ ...newAccountData, accountNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('accounting.initialBalance', 'الرصيد الافتتاحي')}</Label>
              <Input
                type="number"
                value={newAccountData.balance}
                onChange={(e) => setNewAccountData({ ...newAccountData, balance: parseFloat(e.target.value) || 0 })}
              />
            </div>
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
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('accounting.editAccount', 'تعديل الحساب')}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('accounting.accountNameAr', 'اسم الحساب بالعربية')}</Label>
              <Input
                value={editFormData.nameAr}
                onChange={(e) => setEditFormData({ ...editFormData, nameAr: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('accounting.accountNameEn', 'Account Name (English)')}</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('accounting.accountNumber', 'رقم الحساب')}</Label>
              <Input
                value={editFormData.accountNumber}
                onChange={(e) => setEditFormData({ ...editFormData, accountNumber: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('accounting.initialBalance', 'الرصيد الافتتاحي')}</Label>
              <Input
                type="number"
                value={editFormData.balance}
                onChange={(e) => setEditFormData({ ...editFormData, balance: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar' ? 'الرصيد قبل أي قيود يومية' : 'Balance before any journal entries'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)}>
              <X className="w-4 h-4 ml-2" />
              {t('common.cancel', 'إلغاء')}
            </Button>
            <Button onClick={() => editingAccount && handleUpdateAccount(editingAccount)} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 ml-2" />
              {t('common.save', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
