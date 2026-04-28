'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/utils/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/pages/components/card'
import { Button } from '@/app/pages/components/button'
import { toast } from 'sonner'
import { Tag, CheckCircle, Filter, Edit2, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/utils/utils'
import { Dialog } from '@/app/pages/components/dialog'
import { Input } from '@/app/pages/components/input'

interface ExpenseAccount {
  id: string
  accountNumber: string
  name: string
  nameAr: string | null
  balance: number
  expenseClassification: 'OPERATIONAL' | 'ADMINISTRATIVE' | 'MARKETING' | null
}

const classificationLabels = {
  OPERATIONAL: { ar: 'تشغيلية', en: 'Operational', color: 'green' },
  ADMINISTRATIVE: { ar: 'إدارية وعمومية', en: 'Administrative & General', color: 'purple' },
  MARKETING: { ar: 'تسويقية', en: 'Marketing', color: 'orange' }
}

export function ExpenseClassificationManager() {
  const { language, t } = useLanguage()
  const [expenses, setExpenses] = useState<ExpenseAccount[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>({})
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ExpenseAccount | null>(null)
  const [formData, setFormData] = useState({
    accountNumber: '',
    name: '',
    nameAr: '',
    expenseClassification: ''
  })

  useEffect(() => {
    fetchExpenses()
    fetchStats()
  }, [filter])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const url = filter === 'all'
        ? '/api/accounting?type=income-statement'
        : filter === 'UNCLASSIFIED'
        ? '/api/accounting?type=income-statement'
        : `/api/accounting?type=expenses-by-classification&classification=${filter}`

      const res = await fetch(url)
      const data = await res.json()

      let expenseAccounts = data.accounts?.filter((acc: any) => acc.type === 'EXPENSE') || []

      if (filter === 'UNCLASSIFIED') {
        expenseAccounts = expenseAccounts.filter((acc: any) => !acc.expenseClassification)
      }

      setExpenses(expenseAccounts)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error(t('accounting.fetchError', 'فشل في جلب البيانات'))
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/accounting?type=expense-classification-stats')
      const data = await res.json()
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const updateClassification = async (accountId: string, classification: string) => {
    try {
      const res = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateExpenseClassification',
          accountId,
          classification
        })
      })

      if (res.ok) {
        toast.success(t('accounting.classificationUpdated', 'تم تحديث التصنيف بنجاح'))
        fetchExpenses()
        fetchStats()
      } else {
        const error = await res.json()
        toast.error(error.error || t('accounting.updateError', 'فشل في التحديث'))
      }
    } catch (error) {
      console.error('Error updating classification:', error)
      toast.error(t('accounting.updateError', 'فشل في التحديث'))
    }
  }

  const bulkUpdate = async (classification: string) => {
    if (selectedAccounts.length === 0) {
      toast.error(t('accounting.selectAccountsFirst', 'الرجاء اختيار حسابات أولاً'))
      return
    }

    try {
      const res = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulkUpdateClassification',
          accountIds: selectedAccounts,
          classification
        })
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || t('accounting.bulkUpdateSuccess', 'تم تحديث التصنيفات بنجاح'))
        setSelectedAccounts([])
        fetchExpenses()
        fetchStats()
      } else {
        const error = await res.json()
        toast.error(error.error || t('accounting.updateError', 'فشل في التحديث'))
      }
    } catch (error) {
      console.error('Error bulk updating:', error)
      toast.error(t('accounting.updateError', 'فشل في التحديث'))
    }
  }

  const handleAddAccount = async () => {
    try {
      const res = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          type: 'EXPENSE',
          accountNumber: formData.accountNumber,
          name: formData.name,
          nameAr: formData.nameAr,
          expenseClassification: formData.expenseClassification || null
        })
      })

      if (res.ok) {
        toast.success(t('accounting.accountCreated', 'تم إنشاء الحساب بنجاح'))
        setShowAddDialog(false)
        setFormData({ accountNumber: '', name: '', nameAr: '', expenseClassification: '' })
        fetchExpenses()
        fetchStats()
      } else {
        const error = await res.json()
        toast.error(error.error || t('accounting.createError', 'فشل في الإنشاء'))
      }
    } catch (error) {
      console.error('Error adding account:', error)
      toast.error(t('accounting.createError', 'فشل في الإنشاء'))
    }
  }

  const handleEditAccount = async () => {
    if (!editingAccount) return

    try {
      const res = await fetch(`/api/accounting/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: formData.accountNumber,
          name: formData.name,
          nameAr: formData.nameAr,
          expenseClassification: formData.expenseClassification || null
        })
      })

      if (res.ok) {
        toast.success(t('accounting.accountUpdated', 'تم تحديث الحساب بنجاح'))
        setShowEditDialog(false)
        setEditingAccount(null)
        setFormData({ accountNumber: '', name: '', nameAr: '', expenseClassification: '' })
        fetchExpenses()
        fetchStats()
      } else {
        const error = await res.json()
        toast.error(error.error || t('accounting.updateError', 'فشل في التحديث'))
      }
    } catch (error) {
      console.error('Error editing account:', error)
      toast.error(t('accounting.updateError', 'فشل في التحديث'))
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm(t('accounting.confirmDelete', 'هل أنت متأكد من حذف هذا الحساب؟'))) {
      return
    }

    try {
      const res = await fetch(`/api/accounting/${accountId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success(t('accounting.accountDeleted', 'تم حذف الحساب بنجاح'))
        fetchExpenses()
        fetchStats()
      } else {
        const error = await res.json()
        toast.error(error.error || t('accounting.deleteError', 'فشل في الحذف'))
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error(t('accounting.deleteError', 'فشل في الحذف'))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedAccounts.length === 0) {
      toast.error(t('accounting.selectAccountsFirst', 'الرجاء اختيار حسابات أولاً'))
      return
    }

    if (!confirm(t('accounting.confirmBulkDelete', `هل أنت متأكد من حذف ${selectedAccounts.length} حساب؟`))) {
      return
    }

    try {
      const res = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulkDelete',
          accountIds: selectedAccounts
        })
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || t('accounting.accountsDeleted', 'تم حذف الحسابات بنجاح'))
        setSelectedAccounts([])
        fetchExpenses()
        fetchStats()
      } else {
        const error = await res.json()
        toast.error(error.error || t('accounting.deleteError', 'فشل في الحذف'))
      }
    } catch (error) {
      console.error('Error bulk deleting:', error)
      toast.error(t('accounting.deleteError', 'فشل في الحذف'))
    }
  }

  const openAddDialog = () => {
    setFormData({ accountNumber: '', name: '', nameAr: '', expenseClassification: '' })
    setShowAddDialog(true)
  }

  const openEditDialog = (account: ExpenseAccount) => {
    setEditingAccount(account)
    setFormData({
      accountNumber: account.accountNumber,
      name: account.name,
      nameAr: account.nameAr || '',
      expenseClassification: account.expenseClassification || ''
    })
    setShowEditDialog(true)
  }

  const getClassificationBadge = (classification: string | null) => {
    if (!classification) {
      return (
        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
          {language === 'ar' ? 'غير مصنف' : 'Unclassified'}
        </span>
      )
    }

    const config = classificationLabels[classification as keyof typeof classificationLabels]
    const colorClasses = {
      green: 'bg-green-100 text-green-700 border-green-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300'
    }

    return (
      <span className={cn(
        "px-2 py-1 rounded text-xs border font-medium",
        colorClasses[config.color as keyof typeof colorClasses]
      )}>
        {config[language]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-indigo-500">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {t('accounting.expenseClassification', 'تصنيف المصروفات')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Filters */}
          <div className="mb-6 flex gap-2 flex-wrap" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              className={filter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              {language === 'ar' ? 'الكل' : 'All'}
            </Button>
            <Button
              onClick={() => setFilter('OPERATIONAL')}
              variant={filter === 'OPERATIONAL' ? 'default' : 'outline'}
              className={filter === 'OPERATIONAL' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {classificationLabels.OPERATIONAL[language]}
            </Button>
            <Button
              onClick={() => setFilter('ADMINISTRATIVE')}
              variant={filter === 'ADMINISTRATIVE' ? 'default' : 'outline'}
              className={filter === 'ADMINISTRATIVE' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              {classificationLabels.ADMINISTRATIVE[language]}
            </Button>
            <Button
              onClick={() => setFilter('MARKETING')}
              variant={filter === 'MARKETING' ? 'default' : 'outline'}
              className={filter === 'MARKETING' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              {classificationLabels.MARKETING[language]}
            </Button>
            <Button
              onClick={() => setFilter('UNCLASSIFIED')}
              variant={filter === 'UNCLASSIFIED' ? 'default' : 'outline'}
              className={filter === 'UNCLASSIFIED' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {language === 'ar' ? 'غير مصنف' : 'Unclassified'}
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedAccounts.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <p className="mb-3 font-semibold text-blue-900">
                {language === 'ar'
                  ? `تم اختيار ${selectedAccounts.length} حساب`
                  : `${selectedAccounts.length} account(s) selected`}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => bulkUpdate('OPERATIONAL')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  → {classificationLabels.OPERATIONAL[language]}
                </Button>
                <Button
                  onClick={() => bulkUpdate('ADMINISTRATIVE')}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  → {classificationLabels.ADMINISTRATIVE[language]}
                </Button>
                <Button
                  onClick={() => bulkUpdate('MARKETING')}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  → {classificationLabels.MARKETING[language]}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense List */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t('accounting.expenseAccounts', 'حسابات المصروفات')}
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {t('accounting.total', 'الإجمالي')}: {expenses.length}
              </span>
              {selectedAccounts.length > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('common.delete', 'حذف')} ({selectedAccounts.length})
                </Button>
              )}
              <Button
                onClick={openAddDialog}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('common.add', 'إضافة')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500">{t('common.loading', 'جاري التحميل...')}</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">{t('accounting.noExpenses', 'لا توجد مصروفات')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <thead className="bg-gray-100 border-b-2">
                  <tr>
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAccounts(expenses.map(exp => exp.id))
                          } else {
                            setSelectedAccounts([])
                          }
                        }}
                        checked={selectedAccounts.length === expenses.length && expenses.length > 0}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      {t('accounting.accountNumber', 'رقم الحساب')}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      {t('accounting.accountName', 'اسم الحساب')}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      {t('accounting.balance', 'الرصيد')}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      {t('accounting.classification', 'التصنيف')}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      {t('common.actions', 'الإجراءات')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(expense.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAccounts([...selectedAccounts, expense.id])
                            } else {
                              setSelectedAccounts(selectedAccounts.filter(id => id !== expense.id))
                            }
                          }}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-900">
                        {expense.accountNumber}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {language === 'ar' ? expense.nameAr || expense.name : expense.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {Number(expense.balance).toFixed(2)} {t('common.qar', 'ر.ق')}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={expense.expenseClassification || ''}
                          onChange={(e) => updateClassification(expense.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          <option value="">
                            {language === 'ar' ? 'اختر التصنيف' : 'Select Classification'}
                          </option>
                          {Object.entries(classificationLabels).map(([key, labels]) => (
                            <option key={key} value={key}>
                              {labels[language]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditDialog(expense)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title={t('common.edit', 'تعديل')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(expense.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title={t('common.delete', 'حذف')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      {showAddDialog && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h3 className="text-lg font-semibold mb-4">
              {t('accounting.addExpenseAccount', 'إضافة حساب مصروف جديد')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('accounting.accountNumber', 'رقم الحساب')}
                </label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder={t('accounting.enterAccountNumber', 'أدخل رقم الحساب')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('accounting.accountName', 'اسم الحساب')} (English)
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('accounting.enterAccountName', 'أدخل اسم الحساب')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('accounting.accountName', 'اسم الحساب')} (العربية)
                </label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder={t('accounting.enterAccountNameAr', 'أدخل اسم الحساب بالعربية')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('accounting.classification', 'التصنيف')}
                </label>
                <select
                  value={formData.expenseClassification}
                  onChange={(e) => setFormData({ ...formData, expenseClassification: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t('accounting.selectClassification', 'اختر التصنيف')}</option>
                  {Object.entries(classificationLabels).map(([key, labels]) => (
                    <option key={key} value={key}>
                      {labels[language]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <Button
                onClick={() => setShowAddDialog(false)}
                variant="outline"
              >
                {t('common.cancel', 'إلغاء')}
              </Button>
              <Button
                onClick={handleAddAccount}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={!formData.accountNumber || !formData.name}
              >
                {t('common.add', 'إضافة')}
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Edit Account Dialog */}
      {showEditDialog && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h3 className="text-lg font-semibold mb-4">
              {t('accounting.editExpenseAccount', 'تعديل حساب المصروف')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('accounting.accountNumber', 'رقم الحساب')}
                </label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder={t('accounting.enterAccountNumber', 'أدخل رقم الحساب')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('accounting.accountName', 'اسم الحساب')} (English)
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('accounting.enterAccountName', 'أدخل اسم الحساب')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('accounting.accountName', 'اسم الحساب')} (العربية)
                </label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder={t('accounting.enterAccountNameAr', 'أدخل اسم الحساب بالعربية')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('accounting.classification', 'التصنيف')}
                </label>
                <select
                  value={formData.expenseClassification}
                  onChange={(e) => setFormData({ ...formData, expenseClassification: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t('accounting.selectClassification', 'اختر التصنيف')}</option>
                  {Object.entries(classificationLabels).map(([key, labels]) => (
                    <option key={key} value={key}>
                      {labels[language]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <Button
                onClick={() => setShowEditDialog(false)}
                variant="outline"
              >
                {t('common.cancel', 'إلغاء')}
              </Button>
              <Button
                onClick={handleEditAccount}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={!formData.accountNumber || !formData.name}
              >
                {t('common.save', 'حفظ')}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
