'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/utils/LanguageContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/pages/components/select'
import { Input } from '@/app/pages/components/input'
import { cn } from '@/utils/utils'

type ExpenseType = 'operational' | 'general' | 'marketing' | ''

// Categories are now just the enum values - labels come from translations
const OPERATIONAL_CATEGORIES: string[] = [
  'DRIVERS_WAGES',
  'DRIVERS_AWARDS_DEDUCTIONS',
  'DRIVER_TRAINING_LICENSES',
  'VEHICLE_MAINTENANCE',
  'EMPLOYEE_SALARIES_OPERATIONAL',
]

const GENERAL_MANAGEMENT_CATEGORIES: string[] = [
  'ELECTRICITY',
  'GOVERNMENT_FEES',
  'ACCOUNTING_FEES',
  'COMPUTERS',
  'OFFICE_SUPPLIES',
  'CURRENCY_EXCHANGE_LOSSES',
  'REPAIRS_MAINTENANCE',
  'DEPRECIATION',
  'PETTY_CASH',
  'ENTERTAINMENT',
  'SALARIES_ADMIN',
  'ADVERTISING',
  'MISCELLANEOUS_FEES',
]

const MARKETING_CATEGORIES: string[] = [
  'DIGITAL_ADVERTISING',
  'SOCIAL_MEDIA_MARKETING',
  'PRINT_MATERIALS',
  'EVENTS_SPONSORSHIPS',
]

interface ExpenseCategoryTabsProps {
  onSelectCategory: (category: string) => void
  selectedCategory?: string
  disabled?: boolean
}

export default function ExpenseCategoryTabs({ onSelectCategory, selectedCategory, disabled }: ExpenseCategoryTabsProps) {
  const { language, isRTL, t } = useLanguage()
  const [expenseType, setExpenseType] = useState<ExpenseType>('')
  const [subcategory, setSubcategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Update subcategory when selectedCategory changes from parent (e.g., when editing)
  useEffect(() => {
    if (selectedCategory) {
      // Check if it's a custom category
      const allCategories = [...OPERATIONAL_CATEGORIES, ...GENERAL_MANAGEMENT_CATEGORIES, ...MARKETING_CATEGORIES]
      const isKnownCategory = allCategories.includes(selectedCategory)

      if (!isKnownCategory) {
        // Custom category from parent (editing existing record)
        setShowCustomInput(true)
        setCustomCategory(selectedCategory)
        setSubcategory('OTHER')
      } else {
        // Known category from parent (editing existing record)
        setSubcategory(selectedCategory)
        setShowCustomInput(false)
        setCustomCategory('')

        // Auto-detect expense type
        if (OPERATIONAL_CATEGORIES.includes(selectedCategory)) {
          setExpenseType('operational')
        } else if (GENERAL_MANAGEMENT_CATEGORIES.includes(selectedCategory)) {
          setExpenseType('general')
        } else if (MARKETING_CATEGORIES.includes(selectedCategory)) {
          setExpenseType('marketing')
        }
      }
    }
    // Note: We intentionally don't reset states when selectedCategory is empty
    // to preserve user's selections during form interaction
  }, [selectedCategory])

  const getCategoriesForType = (type: ExpenseType): string[] => {
    switch (type) {
      case 'operational':
        return OPERATIONAL_CATEGORIES
      case 'general':
        return GENERAL_MANAGEMENT_CATEGORIES
      case 'marketing':
        return MARKETING_CATEGORIES
      default:
        return []
    }
  }

  const handleExpenseTypeChange = (value: string) => {
    setExpenseType(value as ExpenseType)
    setSubcategory('')
    setShowCustomInput(false)
    setCustomCategory('')
  }

  const handleSubcategoryChange = (value: string) => {
    setSubcategory(value)
    if (value === 'OTHER') {
      setShowCustomInput(true)
      setCustomCategory('')
    } else {
      setShowCustomInput(false)
      setCustomCategory('')
      onSelectCategory(value)
    }
  }

  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value)
    // Only send the value if it's not empty, otherwise send empty string
    onSelectCategory(value.trim() || '')
  }

  const currentCategories = getCategoriesForType(expenseType)

  return (
    <div className="space-y-4">
      {/* Expense Type Dropdown */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {language === 'ar' ? 'نوع المصروف' : 'Expense Type'}
        </label>
        <Select
          value={expenseType || undefined}
          onValueChange={handleExpenseTypeChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={language === 'ar' ? 'اختر نوع المصروف' : 'Select expense type'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="operational">
              {language === 'ar' ? 'تشغيلية' : 'Operational'}
            </SelectItem>
            <SelectItem value="general">
              {language === 'ar' ? 'عامة وإدارية' : 'General and Management'}
            </SelectItem>
            <SelectItem value="marketing">
              {language === 'ar' ? 'تسويق' : 'Marketing'}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subcategory Dropdown - Only show when expense type is selected */}
      {expenseType && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {language === 'ar' ? 'الفئة الفرعية' : 'Subcategory'}
          </label>
          <Select
            value={subcategory || undefined}
            onValueChange={handleSubcategoryChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === 'ar' ? 'اختر الفئة الفرعية' : 'Select subcategory'} />
            </SelectTrigger>
            <SelectContent>
              {currentCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {t(`categories.${category}`)}
                </SelectItem>
              ))}
              <SelectItem value="OTHER">
                {language === 'ar' ? 'أخرى (اكتب يدوياً)' : 'Other (type manually)'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Custom Category Input - Only show when expense type is selected AND "Other" is chosen */}
      {expenseType && showCustomInput && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {language === 'ar' ? 'اكتب الفئة المخصصة' : 'Enter Custom Category'}
          </label>
          <Input
            type="text"
            value={customCategory}
            onChange={(e) => handleCustomCategoryChange(e.target.value)}
            placeholder={language === 'ar' ? 'اكتب اسم الفئة...' : 'Type category name...'}
            disabled={disabled}
            className={cn(isRTL && 'text-right')}
          />
        </div>
      )}
    </div>
  )
}
