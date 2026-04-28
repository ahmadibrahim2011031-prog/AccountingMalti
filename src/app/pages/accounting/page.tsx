'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/layout/DashboardLayout'
import { useLanguage } from '@/utils/LanguageContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/pages/components/tabs'
import { BalanceSheet } from './components/BalanceSheet'
import { JournalEntries } from './components/JournalEntries'
import { ProfitLossStatement } from './components/ProfitLossStatement'
import { GeneralLedger } from './components/GeneralLedger'
import { Reports } from './components/Reports'
import { FileText, Receipt, TrendingUp, BookOpen, BarChart3 } from 'lucide-react'

export default function AccountingPage() {
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState('journal-entries')

  // Define tabs array - Restructured for standard accounting practices
  const tabsArray = [
    {
      value: 'journal-entries',
      icon: Receipt,
      label: t('accounting.journalEntries', 'قيود اليومية'),
      shortLabel: t('accounting.je', 'قيود'),
      colors: 'from-indigo-500 to-purple-600',
      group: null
    },
    {
      value: 'balance-sheet',
      icon: FileText,
      label: t('accounting.balanceSheet', 'الميزانية العمومية'),
      shortLabel: t('accounting.bs', 'الميزانية'),
      colors: 'from-blue-500 to-indigo-600',
      group: 'chart-of-accounts'
    },
    {
      value: 'profit-loss',
      icon: TrendingUp,
      label: t('accounting.profitLossStatement', 'قائمة الأرباح والخسائر'),
      shortLabel: t('accounting.pl', 'أ/خ'),
      colors: 'from-green-500 to-emerald-600',
      group: 'chart-of-accounts'
    },
    {
      value: 'general-ledger',
      icon: BookOpen,
      label: t('accounting.generalLedger', 'دفتر الأستاذ'),
      shortLabel: t('accounting.gl', 'الأستاذ'),
      colors: 'from-purple-500 to-violet-600',
      group: null
    },
    {
      value: 'reports',
      icon: BarChart3,
      label: t('accounting.reports', 'التقارير'),
      shortLabel: t('accounting.rpt', 'تقارير'),
      colors: 'from-orange-500 to-red-600',
      group: null
    }
  ]

  // REVERSE tabs array for Arabic
  const displayTabs = language === 'ar' ? [...tabsArray].reverse() : tabsArray

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            {t('accounting.systemTitle', 'نظام المحاسبة')}
          </h1>
          <p className="text-gray-600">
            {t('accounting.systemSubtitle', 'إدارة شاملة للحسابات المالية والتقارير')}
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Chart of Accounts Label */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="grid grid-cols-12 gap-2">
              {/* Journal Entries */}
              <div className="col-span-12 sm:col-span-3">
                <button
                  onClick={() => setActiveTab('journal-entries')}
                  className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                    activeTab === 'journal-entries'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">
                    {t('accounting.journalEntries', 'قيود اليومية')}
                  </span>
                  <span className="sm:hidden font-medium">
                    {t('accounting.je', 'قيود')}
                  </span>
                </button>
              </div>

              {/* Chart of Accounts Group */}
              <div className="col-span-12 sm:col-span-6">
                <div className="border-2 border-gray-300 rounded-lg p-2 bg-gradient-to-br from-gray-50 to-blue-50">
                  <div className="text-xs font-semibold text-gray-600 text-center mb-2 uppercase tracking-wide">
                    {t('accounting.chartOfAccounts', 'دليل الحسابات')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Balance Sheet */}
                    <button
                      onClick={() => setActiveTab('balance-sheet')}
                      className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                        activeTab === 'balance-sheet'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                          : 'bg-white hover:bg-blue-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline font-medium text-sm">
                        {t('accounting.balanceSheet', 'الميزانية العمومية')}
                      </span>
                      <span className="sm:hidden font-medium text-sm">
                        {t('accounting.bs', 'الميزانية')}
                      </span>
                    </button>

                    {/* Profit & Loss */}
                    <button
                      onClick={() => setActiveTab('profit-loss')}
                      className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                        activeTab === 'profit-loss'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                          : 'bg-white hover:bg-green-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span className="hidden sm:inline font-medium text-sm">
                        {t('accounting.profitLossStatement', 'قائمة الأرباح والخسائر')}
                      </span>
                      <span className="sm:hidden font-medium text-sm">
                        {t('accounting.pl', 'أ/خ')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* General Ledger & Reports */}
              <div className="col-span-12 sm:col-span-3 grid grid-cols-2 sm:grid-cols-1 gap-2">
                <button
                  onClick={() => setActiveTab('general-ledger')}
                  className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                    activeTab === 'general-ledger'
                      ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">
                    {t('accounting.generalLedger', 'دفتر الأستاذ')}
                  </span>
                  <span className="sm:hidden font-medium">
                    {t('accounting.gl', 'الأستاذ')}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                    activeTab === 'reports'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">
                    {t('accounting.reports', 'التقارير')}
                  </span>
                  <span className="sm:hidden font-medium">
                    {t('accounting.rpt', 'تقارير')}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Contents */}
          <TabsContent value="journal-entries" className="mt-6">
            <JournalEntries />
          </TabsContent>

          <TabsContent value="balance-sheet" className="mt-6">
            <BalanceSheet />
          </TabsContent>

          <TabsContent value="profit-loss" className="mt-6">
            <ProfitLossStatement />
          </TabsContent>

          <TabsContent value="general-ledger" className="mt-6">
            <GeneralLedger />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Reports />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
