// src/layout/Header.tsx - UPDATED WITH SEARCH FUNCTIONALITY
'use client'

import { Fragment, useState, useEffect, useRef } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Menu as MenuIcon,
  Bell,
  Search,
  User,
  Globe,
  ChevronDown,
  Settings,
  LogOut,
  Users,
  Truck
} from 'lucide-react'
import { useLanguage } from '@/utils/LanguageContext'
import { cn } from '@/utils/utils'

// Helper function to format role display names
const getRoleDisplayName = (role: string, language: string): string => {
  const roleMap: { [key: string]: { en: string; ar: string } } = {
    'ADMIN': { en: 'Administrator', ar: 'مدير النظام' },
    'HR_MANAGER': { en: 'HR Manager', ar: 'مدير الموارد البشرية' },
    'HOUSING_MANAGER': { en: 'Housing Manager', ar: 'مدير السكن' },
    'OPERATIONS_MANAGER': { en: 'Operations Manager', ar: 'مدير العمليات' },
    'ACCOUNTANT': { en: 'Accountant', ar: 'محاسب' },
    'LEGAL_MANAGER': { en: 'Legal Manager', ar: 'مدير الشؤون القانونية' }
  }

  const roleInfo = roleMap[role] || { en: role, ar: role }
  return language === 'ar' ? roleInfo.ar : roleInfo.en
}


interface HeaderProps {
  onMenuClick: () => void
  session: Session // ✅ This is correct - session is guaranteed to exist by parent
  locale: string
  dict: {
    nav: {
      dashboard: string
      drivers: string
      operations: string
      platforms: string
      deliveries: string
      payroll: string
      time: string
      accounting: string
      legal: string
      settings: string
    }
    common: {
      search: string
      profile: string
      signOut: string
      menu: string
    }
  }
  isRTL: boolean
  sidebarOpen: boolean
}

export function Header({
  onMenuClick,
  session,
  locale,
  dict,
  isRTL,
  sidebarOpen
}: HeaderProps) {
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()

  // Search state management
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    employees: any[]
    vehicles: any[]
  }>({ employees: [], vehicles: [] })
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Fixed language change handler
  const handleLanguageChange = (newLanguage: 'en' | 'ar') => {
    if (language !== newLanguage) {
      setLanguage(newLanguage)
    }
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/pages/login')
  }

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search function
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults({ employees: [], vehicles: [] })
        setShowResults(false)
        return
      }

      setIsSearching(true)
      setShowResults(true)

      try {
        // Search employees
        const employeesResponse = await fetch(`/api/hr?search=${encodeURIComponent(searchQuery)}`)
        const employeesData = await employeesResponse.json()

        // Search vehicles (note: operations API requires type=vehicles parameter)
        const vehiclesResponse = await fetch(`/api/operations?type=vehicles&search=${encodeURIComponent(searchQuery)}`)
        const vehiclesData = await vehiclesResponse.json()

        setSearchResults({
          employees: employeesData.data?.employees || employeesData.employees || [],
          vehicles: vehiclesData.data?.vehicles || vehiclesData.vehicles || []
        })
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults({ employees: [], vehicles: [] })
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(performSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleEmployeeClick = (employeeId: string) => {
    setShowResults(false)
    setSearchQuery('')
    router.push(`/pages/hr`)
  }

  const handleVehicleClick = (vehicleId: string) => {
    setShowResults(false)
    setSearchQuery('')
    router.push(`/pages/operations`)
  }

  return (
    <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left Side - Menu Button & Search */}
      <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-4" : "space-x-4")}>
        <button
          onClick={onMenuClick}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          aria-label={dict.common.menu}
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Search Bar - Only visible for ADMIN */}
        {session.user?.role === 'ADMIN' && (
          <div ref={searchRef} className="relative hidden md:block">
            <Search className={cn(
              "absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4",
              isRTL ? "right-3" : "left-3"
            )} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              placeholder={dict.common.search}
              className={cn(
                "w-80 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50",
                isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
              )}
            />

          {/* Search Results Dropdown */}
          {showResults && (searchResults.employees.length > 0 || searchResults.vehicles.length > 0 || isSearching) && (
            <div className={cn(
              "absolute mt-2 w-96 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 max-h-96 overflow-y-auto z-50",
              isRTL ? "right-0" : "left-0"
            )}>
              {isSearching ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-2 text-sm">{language === 'ar' ? 'جاري البحث...' : 'Searching...'}</p>
                </div>
              ) : (
                <>
                  {/* Employees Section */}
                  {searchResults.employees.length > 0 && (
                    <div className="py-2">
                      <div className={cn(
                        "px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50",
                        isRTL && "text-right"
                      )}>
                        <div className={cn("flex items-center", isRTL && "flex-row-reverse")}>
                          <Users className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'الموظفين' : 'Employees'}
                        </div>
                      </div>
                      {searchResults.employees.slice(0, 5).map((employee: any) => (
                        <button
                          key={employee.id}
                          onClick={() => handleEmployeeClick(employee.id)}
                          className={cn(
                            "w-full px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0",
                            isRTL && "text-right"
                          )}
                        >
                          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                            {employee.profileImage ? (
                              <img
                                src={employee.profileImage}
                                alt={employee.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                            )}
                            <div className={cn("flex-1", isRTL && "text-right")}>
                              <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                              <p className="text-xs text-gray-500">
                                {language === 'ar' ? 'معرف: ' : 'ID: '}{employee.employeeId}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Vehicles Section */}
                  {searchResults.vehicles.length > 0 && (
                    <div className="py-2">
                      <div className={cn(
                        "px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50",
                        isRTL && "text-right"
                      )}>
                        <div className={cn("flex items-center", isRTL && "flex-row-reverse")}>
                          <Truck className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'المركبات' : 'Vehicles'}
                        </div>
                      </div>
                      {searchResults.vehicles.slice(0, 5).map((vehicle: any) => (
                        <button
                          key={vehicle.id}
                          onClick={() => handleVehicleClick(vehicle.id)}
                          className={cn(
                            "w-full px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0",
                            isRTL && "text-right"
                          )}
                        >
                          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <Truck className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className={cn("flex-1", isRTL && "text-right")}>
                              <p className="text-sm font-medium text-gray-900">
                                {vehicle.brand} {vehicle.model}
                              </p>
                              <p className="text-xs text-gray-500">
                                {language === 'ar' ? 'لوحة: ' : 'Plate: '}{vehicle.plateNumber}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No Results */}
                  {!isSearching && searchResults.employees.length === 0 && searchResults.vehicles.length === 0 && searchQuery && (
                    <div className="p-4 text-center text-gray-500">
                      <Search className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm">
                        {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Right Side - Language Switcher, Notifications & User Menu */}
      <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-4" : "space-x-4")}>

        {/* Language Switcher */}
        <Menu as="div" className="relative">
          <Menu.Button className={cn(
            "flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
            isRTL && "flex-row-reverse"
          )}>
            <Globe className="w-5 h-5" />
            <span className={cn("text-sm font-medium", isRTL ? "mr-2" : "ml-2")}>
              {language === 'ar' ? 'العربية' : 'English'}
            </span>
            <ChevronDown className={cn("w-4 h-4", isRTL ? "mr-1" : "ml-1")} />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className={cn(
              "absolute mt-2 w-36 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10",
              isRTL ? "left-0" : "right-0"
            )}>
              <div className="py-1">
                <Menu.Item>
                  {({ active }: { active: boolean }) => (
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={cn(
                        "w-full px-4 py-2 text-sm flex items-center",
                        isRTL ? "text-right flex-row-reverse" : "text-left",
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                        language === 'en' && "bg-blue-50 text-blue-700"
                      )}
                    >
                      <span>🇺🇸</span>
                      <span className={cn(isRTL ? "mr-2" : "ml-2")}>English</span>
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }: { active: boolean }) => (
                    <button
                      onClick={() => handleLanguageChange('ar')}
                      className={cn(
                        "w-full px-4 py-2 text-sm flex items-center",
                        isRTL ? "text-right flex-row-reverse" : "text-left",
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                        language === 'ar' && "bg-blue-50 text-blue-700"
                      )}
                    >
                      <span>🇶🇦</span>
                      <span className={cn(isRTL ? "mr-2" : "ml-2")}>العربية</span>
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* Notifications */}
        <button
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User Menu */}
        <Menu as="div" className="relative">
          <Menu.Button className={cn(
            "flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
            isRTL && "flex-row-reverse"
          )}>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              {session.user?.image ? (
                <img
                  className="w-8 h-8 rounded-full"
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                />
              ) : (
                <User className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className={cn("hidden md:block", isRTL ? "text-right mr-3" : "text-left ml-3")}>
              <p className="text-sm font-medium text-gray-900">
                {session.user?.name || (language === 'ar' ? 'مستخدم' : 'User')}
              </p>
              <p className="text-xs text-gray-600">
                {session.user?.role ? getRoleDisplayName(session.user.role, language) : ''}
              </p>
            </div>
            <ChevronDown className={cn("w-4 h-4 hidden md:block", isRTL ? "mr-1" : "ml-1")} />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className={cn(
              "absolute mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10",
              isRTL ? "left-0" : "right-0"
            )}>
              <div className="py-1">
                <Menu.Item>
                  {({ active }: { active: boolean }) => (
                    <button
                      onClick={() => router.push('/settings')}
                      className={cn(
                        "w-full px-4 py-2 text-sm flex items-center",
                        isRTL ? "text-right flex-row-reverse" : "text-left",
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      )}
                    >
                      <Settings className="w-4 h-4" />
                      <span className={cn(isRTL ? "mr-2" : "ml-2")}>
                        {dict.nav.settings}
                      </span>
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }: { active: boolean }) => (
                    <button
                      onClick={handleSignOut}
                      className={cn(
                        "w-full px-4 py-2 text-sm flex items-center text-red-600 hover:bg-red-50",
                        isRTL ? "text-right flex-row-reverse" : "text-left",
                        active && "bg-red-50"
                      )}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className={cn(isRTL ? "mr-2" : "ml-2")}>
                        {dict.common.signOut}
                      </span>
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  )
}