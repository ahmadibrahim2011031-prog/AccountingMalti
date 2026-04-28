'use client'

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/utils/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/pages/components/card'
import { Button } from '@/app/pages/components/button'
import { Input } from '@/app/pages/components/input'
import { Label } from '@/app/pages/components/label'
import { toast } from 'sonner'
import {
  BarChart3, Download, Calendar, FileText, TrendingUp, DollarSign,
  PieChart, Activity, Printer, FileSpreadsheet
} from 'lucide-react'
import { cn } from '@/utils/utils'

interface ReportData {
  balanceSheet?: {
    assets: number
    liabilities: number
    equity: number
  }
  incomeStatement?: {
    revenue: number
    expenses: number
    netProfit: number
  }
  trialBalance?: {
    totalDebit: number
    totalCredit: number
    accounts: Array<{
      accountNumber: string
      name: string
      debit: number
      credit: number
    }>
  }
  cashFlow?: {
    operating: number
    investing: number
    financing: number
    netCashFlow: number
  }
  analysis?: {
    topExpenses: Array<{
      category: string
      amount: number
      percentage: number
    }>
    topRevenue: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
}

export function Reports() {
  const { t, language } = useLanguage()
  const [selectedReport, setSelectedReport] = useState<string>('balance-sheet')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reportData, setReportData] = useState<ReportData>({})
  const [loading, setLoading] = useState(false)

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
      fetchReportData()
    }
  }, [selectedReport, dateFrom, dateTo])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/accounting?type=report&reportType=${selectedReport}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      )
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error(t('accounting.fetchError', 'فشل في جلب البيانات'))
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    try {
      let csvContent = ''
      const reportName = reportTypes.find(r => r.id === selectedReport)?.name || 'Report'

      // Generate CSV based on report type
      if (selectedReport === 'balance-sheet' && reportData.balanceSheet) {
        csvContent = `${reportName}\n`
        csvContent += `${t('accounting.asOf', 'As Of')}: ${dateTo}\n\n`
        csvContent += `${t('accounting.assets', 'Assets')},${reportData.balanceSheet.assets.toFixed(2)}\n`
        csvContent += `${t('accounting.liabilities', 'Liabilities')},${reportData.balanceSheet.liabilities.toFixed(2)}\n`
        csvContent += `${t('accounting.equity', 'Equity')},${reportData.balanceSheet.equity.toFixed(2)}\n`
      } else if (selectedReport === 'income-statement' && reportData.incomeStatement) {
        csvContent = `${reportName}\n`
        csvContent += `${t('accounting.period', 'Period')}: ${dateFrom} - ${dateTo}\n\n`
        csvContent += `${t('accounting.revenue', 'Revenue')},${reportData.incomeStatement.revenue.toFixed(2)}\n`
        csvContent += `${t('accounting.expenses', 'Expenses')},${reportData.incomeStatement.expenses.toFixed(2)}\n`
        csvContent += `${t('accounting.netProfit', 'Net Profit')},${reportData.incomeStatement.netProfit.toFixed(2)}\n`
      } else if (selectedReport === 'trial-balance' && reportData.trialBalance) {
        csvContent = `${reportName}\n`
        csvContent += `${t('accounting.asOf', 'As Of')}: ${dateTo}\n\n`
        csvContent += `${t('accounting.accountNumber', 'Account Number')},${t('accounting.accountName', 'Account Name')},${t('accounting.debit', 'Debit')},${t('accounting.credit', 'Credit')}\n`
        reportData.trialBalance.accounts.forEach(account => {
          csvContent += `${account.accountNumber},${account.name},${account.debit.toFixed(2)},${account.credit.toFixed(2)}\n`
        })
        csvContent += `\n${t('accounting.totals', 'Totals')},,${reportData.trialBalance.totalDebit.toFixed(2)},${reportData.trialBalance.totalCredit.toFixed(2)}\n`
      } else if (selectedReport === 'cash-flow' && reportData.cashFlow) {
        csvContent = `${reportName}\n`
        csvContent += `${t('accounting.period', 'Period')}: ${dateFrom} - ${dateTo}\n\n`
        csvContent += `${t('accounting.operatingActivities', 'Operating Activities')},${reportData.cashFlow.operating.toFixed(2)}\n`
        csvContent += `${t('accounting.investingActivities', 'Investing Activities')},${reportData.cashFlow.investing.toFixed(2)}\n`
        csvContent += `${t('accounting.financingActivities', 'Financing Activities')},${reportData.cashFlow.financing.toFixed(2)}\n`
        csvContent += `${t('accounting.netCashFlow', 'Net Cash Flow')},${reportData.cashFlow.netCashFlow.toFixed(2)}\n`
      } else if (selectedReport === 'analysis' && reportData.analysis) {
        csvContent = `${reportName}\n`
        csvContent += `${t('accounting.period', 'Period')}: ${dateFrom} - ${dateTo}\n\n`
        csvContent += `${t('accounting.topExpenses', 'Top Expenses')}\n`
        csvContent += `Category,Amount,Percentage\n`
        reportData.analysis.topExpenses.forEach(expense => {
          csvContent += `${expense.category},${expense.amount.toFixed(2)},${expense.percentage.toFixed(1)}%\n`
        })
        csvContent += `\n${t('accounting.topRevenue', 'Top Revenue')}\n`
        csvContent += `Category,Amount,Percentage\n`
        reportData.analysis.topRevenue.forEach(revenue => {
          csvContent += `${revenue.category},${revenue.amount.toFixed(2)},${revenue.percentage.toFixed(1)}%\n`
        })
      }

      // Create and download CSV file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedReport}_${dateFrom}_${dateTo}.csv`
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success(t('accounting.exportSuccess', 'Exported successfully'))
    } catch (error) {
      console.error('Export error:', error)
      toast.error(t('accounting.exportError', 'Export failed'))
    }
  }

  const handleExportPDF = async () => {
    try {
      const dateRange = { from: dateFrom, to: dateTo }

      switch (selectedReport) {
        case 'balance-sheet':
          if (reportData.balanceSheet) {
            const { downloadBalanceSheetPDF, formatBalanceSheetData } = await import('@/utils/pdfGenerator')
            // Format the data to match the new PDF component requirements
            const formattedData = formatBalanceSheetData(reportData.balanceSheet)
            await downloadBalanceSheetPDF(formattedData, dateRange, language)
            toast.success(t('accounting.exportSuccess', 'تم التصدير بنجاح'))
          } else {
            toast.error(t('accounting.noDataToExport', 'لا توجد بيانات للتصدير'))
          }
          break

        case 'income-statement':
          if (reportData.incomeStatement) {
            const { downloadIncomeStatementPDF, formatIncomeStatementData } = await import('@/utils/pdfGenerator')
            const formattedData = formatIncomeStatementData(reportData.incomeStatement)
            await downloadIncomeStatementPDF(formattedData, dateRange, language)
            toast.success(t('accounting.exportSuccess', 'تم التصدير بنجاح'))
          } else {
            toast.error(t('accounting.noDataToExport', 'لا توجد بيانات للتصدير'))
          }
          break

        case 'trial-balance':
          if (reportData.trialBalance) {
            const { downloadTrialBalancePDF, formatTrialBalanceData } = await import('@/utils/pdfGenerator')
            const formattedData = formatTrialBalanceData(reportData.trialBalance)
            await downloadTrialBalancePDF(formattedData, dateRange, language)
            toast.success(t('accounting.exportSuccess', 'تم التصدير بنجاح'))
          } else {
            toast.error(t('accounting.noDataToExport', 'لا توجد بيانات للتصدير'))
          }
          break

        case 'cash-flow':
          if (reportData.cashFlow) {
            const { downloadCashFlowPDF, formatCashFlowData } = await import('@/utils/pdfGenerator')
            const formattedData = formatCashFlowData(reportData.cashFlow)
            await downloadCashFlowPDF(formattedData, dateRange, language)
            toast.success(t('accounting.exportSuccess', 'تم التصدير بنجاح'))
          } else {
            toast.error(t('accounting.noDataToExport', 'لا توجد بيانات للتصدير'))
          }
          break

        case 'analysis':
          toast.info(t('accounting.analysisReportPDFNotAvailable', 'تقرير التحليل المالي متاح كـ Excel فقط'))
          break

        default:
          toast.error(t('accounting.invalidReportType', 'نوع التقرير غير صالح'))
      }
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error(t('accounting.exportError', 'فشل التصدير'))
    }
  }

  const reportTypes = [
    {
      id: 'balance-sheet',
      name: t('accounting.balanceSheetReport', 'تقرير الميزانية العمومية'),
      icon: FileText,
      color: 'blue'
    },
    {
      id: 'income-statement',
      name: t('accounting.incomeStatementReport', 'تقرير قائمة الدخل'),
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 'trial-balance',
      name: t('accounting.trialBalance', 'ميزان المراجعة'),
      icon: BarChart3,
      color: 'purple'
    },
    {
      id: 'cash-flow',
      name: t('accounting.cashFlowStatement', 'قائمة التدفقات النقدية'),
      icon: DollarSign,
      color: 'orange'
    },
    {
      id: 'analysis',
      name: t('accounting.financialAnalysis', 'التحليل المالي'),
      icon: PieChart,
      color: 'pink'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Report Selection & Filters */}
      <Card className="border-2 border-orange-500">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t('accounting.reports', 'التقارير')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <Label>{t('accounting.reportType', 'نوع التقرير')}</Label>
              <div className="mt-2 space-y-2">
                {reportTypes.map(report => {
                  const Icon = report.icon
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                        selectedReport === report.id
                          ? `border-${report.color}-500 bg-${report.color}-50`
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5",
                        selectedReport === report.id ? `text-${report.color}-600` : "text-gray-500"
                      )} />
                      <span className={cn(
                        "text-sm font-medium text-right flex-1",
                        selectedReport === report.id ? `text-${report.color}-700` : "text-gray-700"
                      )}>
                        {report.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    {t('common.print', 'طباعة')}
                  </Button>
                  <Button
                    onClick={handleExportExcel}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {t('common.exportExcel', 'تصدير Excel')}
                  </Button>
                  <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {t('common.exportPDF', 'تصدير PDF')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
              <p className="text-gray-500">{t('common.loading', 'جاري التحميل...')}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Balance Sheet Report */}
          {selectedReport === 'balance-sheet' && reportData.balanceSheet && (
            <Card className="border-2 border-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <CardTitle>{t('accounting.balanceSheetReport', 'تقرير الميزانية العمومية')}</CardTitle>
                <p className="text-sm opacity-90">
                  {t('accounting.asOf', 'كما في')} {new Date(dateTo).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')}
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">{t('accounting.assets', 'الأصول')}</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {reportData.balanceSheet.assets.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{t('common.qar', 'ر.ق')}</div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">{t('accounting.liabilities', 'الالتزامات')}</div>
                    <div className="text-3xl font-bold text-red-600">
                      {reportData.balanceSheet.liabilities.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{t('common.qar', 'ر.ق')}</div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">{t('accounting.equity', 'حقوق الملكية')}</div>
                    <div className="text-3xl font-bold text-green-600">
                      {reportData.balanceSheet.equity.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{t('common.qar', 'ر.ق')}</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t('accounting.balanceEquation', 'الأصول = الالتزامات + حقوق الملكية')}</span>
                    <span className={cn(
                      "font-bold",
                      Math.abs(reportData.balanceSheet.assets - (reportData.balanceSheet.liabilities + reportData.balanceSheet.equity)) < 0.01
                        ? "text-green-600"
                        : "text-red-600"
                    )}>
                      {Math.abs(reportData.balanceSheet.assets - (reportData.balanceSheet.liabilities + reportData.balanceSheet.equity)) < 0.01
                        ? t('accounting.balanced', 'متوازنة ✓')
                        : t('accounting.unbalanced', 'غير متوازنة ✗')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Income Statement Report */}
          {selectedReport === 'income-statement' && reportData.incomeStatement && (
            <Card className="border-2 border-green-500">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CardTitle>{t('accounting.incomeStatementReport', 'تقرير قائمة الدخل')}</CardTitle>
                <p className="text-sm opacity-90">
                  {t('accounting.period', 'الفترة')}: {new Date(dateFrom).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')} - {new Date(dateTo).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')}
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-gray-700">{t('accounting.revenue', 'الإيرادات')}</span>
                      <span className="text-2xl font-bold text-green-600">
                        {reportData.incomeStatement.revenue.toFixed(2)} {t('common.qar', 'ر.ق')}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-gray-700">{t('accounting.expenses', 'المصروفات')}</span>
                      <span className="text-2xl font-bold text-red-600">
                        {reportData.incomeStatement.expenses.toFixed(2)} {t('common.qar', 'ر.ق')}
                      </span>
                    </div>
                  </div>

                  <div className={cn(
                    "p-6 rounded-lg border-2",
                    reportData.incomeStatement.netProfit >= 0
                      ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-500"
                      : "bg-gradient-to-br from-red-50 to-rose-50 border-red-500"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-gray-900">
                        {reportData.incomeStatement.netProfit >= 0
                          ? t('accounting.netProfit', 'صافي الربح')
                          : t('accounting.netLoss', 'صافي الخسارة')}
                      </span>
                      <span className={cn(
                        "text-3xl font-bold",
                        reportData.incomeStatement.netProfit >= 0 ? "text-blue-600" : "text-red-600"
                      )}>
                        {Math.abs(reportData.incomeStatement.netProfit).toFixed(2)} {t('common.qar', 'ر.ق')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trial Balance Report */}
          {selectedReport === 'trial-balance' && reportData.trialBalance && (
            <Card className="border-2 border-purple-500">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-600 text-white">
                <CardTitle>{t('accounting.trialBalance', 'ميزان المراجعة')}</CardTitle>
                <p className="text-sm opacity-90">
                  {t('accounting.asOf', 'كما في')} {new Date(dateTo).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-100 border-b-2">
                      <tr>
                        <th className="px-4 py-3 text-right font-semibold">{t('accounting.accountNumber', 'رقم الحساب')}</th>
                        <th className="px-4 py-3 text-right font-semibold">{t('accounting.accountName', 'اسم الحساب')}</th>
                        <th className="px-4 py-3 text-right font-semibold bg-green-50">{t('accounting.debit', 'مدين')}</th>
                        <th className="px-4 py-3 text-right font-semibold bg-red-50">{t('accounting.credit', 'دائن')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reportData.trialBalance.accounts.map((account, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-sm">{account.accountNumber}</td>
                          <td className="px-4 py-3">{account.name}</td>
                          <td className="px-4 py-3 text-green-600 font-semibold bg-green-50">
                            {account.debit > 0 ? `${account.debit.toFixed(2)} ${t('common.qar', 'ر.ق')}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-red-600 font-semibold bg-red-50">
                            {account.credit > 0 ? `${account.credit.toFixed(2)} ${t('common.qar', 'ر.ق')}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-purple-100 border-t-2 font-bold">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-right">{t('accounting.totals', 'الإجماليات')}</td>
                        <td className="px-4 py-3 text-green-600 bg-green-50">
                          {reportData.trialBalance.totalDebit.toFixed(2)} {t('common.qar', 'ر.ق')}
                        </td>
                        <td className="px-4 py-3 text-red-600 bg-red-50">
                          {reportData.trialBalance.totalCredit.toFixed(2)} {t('common.qar', 'ر.ق')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="p-4 bg-gray-100 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t('accounting.balanceCheck', 'فحص التوازن')}</span>
                    <span className={cn(
                      "font-bold",
                      Math.abs(reportData.trialBalance.totalDebit - reportData.trialBalance.totalCredit) < 0.01
                        ? "text-green-600"
                        : "text-red-600"
                    )}>
                      {Math.abs(reportData.trialBalance.totalDebit - reportData.trialBalance.totalCredit) < 0.01
                        ? t('accounting.balanced', 'متوازن ✓')
                        : t('accounting.unbalanced', 'غير متوازن ✗')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cash Flow Statement */}
          {selectedReport === 'cash-flow' && reportData.cashFlow && (
            <Card className="border-2 border-orange-500">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                <CardTitle>{t('accounting.cashFlowStatement', 'قائمة التدفقات النقدية')}</CardTitle>
                <p className="text-sm opacity-90">
                  {t('accounting.period', 'الفترة')}: {new Date(dateFrom).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')} - {new Date(dateTo).toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US')}
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-6 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{t('accounting.operatingActivities', 'الأنشطة التشغيلية')}</span>
                      <span className="text-xl font-bold text-blue-600">
                        {reportData.cashFlow.operating.toFixed(2)} {t('common.qar', 'ر.ق')}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{t('accounting.investingActivities', 'الأنشطة الاستثمارية')}</span>
                      <span className="text-xl font-bold text-purple-600">
                        {reportData.cashFlow.investing.toFixed(2)} {t('common.qar', 'ر.ق')}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 bg-pink-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{t('accounting.financingActivities', 'الأنشطة التمويلية')}</span>
                      <span className="text-xl font-bold text-pink-600">
                        {reportData.cashFlow.financing.toFixed(2)} {t('common.qar', 'ر.ق')}
                      </span>
                    </div>
                  </div>

                  <div className={cn(
                    "p-6 rounded-lg border-2",
                    reportData.cashFlow.netCashFlow >= 0
                      ? "bg-green-50 border-green-500"
                      : "bg-red-50 border-red-500"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{t('accounting.netCashFlow', 'صافي التدفق النقدي')}</span>
                      <span className={cn(
                        "text-2xl font-bold",
                        reportData.cashFlow.netCashFlow >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {reportData.cashFlow.netCashFlow.toFixed(2)} {t('common.qar', 'ر.ق')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Analysis */}
          {selectedReport === 'analysis' && reportData.analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2 border-red-500">
                <CardHeader className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
                  <CardTitle>{t('accounting.topExpenses', 'أعلى المصروفات')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {reportData.analysis.topExpenses.map((expense, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{expense.category}</span>
                            <span className="font-bold text-red-600">
                              {expense.amount.toFixed(2)} {t('common.qar', 'ر.ق')}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-red-500 to-rose-600 h-2 rounded-full"
                              style={{ width: `${expense.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{expense.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-500">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <CardTitle>{t('accounting.topRevenue', 'أعلى الإيرادات')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {reportData.analysis.topRevenue.map((revenue, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{revenue.category}</span>
                            <span className="font-bold text-green-600">
                              {revenue.amount.toFixed(2)} {t('common.qar', 'ر.ق')}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                              style={{ width: `${revenue.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{revenue.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
