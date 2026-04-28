// src/layout/DashboardLayout.tsx - FIXED RTL VERSION
'use client'

import { ReactNode, useState, useEffect } from 'react'
import Image from 'next/image'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useLanguage } from '@/utils/LanguageContext'

import { cn } from '@/utils/utils'


interface DashboardLayoutProps {
  children: ReactNode
  showSidebar?: boolean
  containerized?: boolean
}

export function DashboardLayout({
  children,
  showSidebar = true,
  containerized = false
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false) // ✅ Start closed on mobile
  const { data: session, status } = useSession()
  const { language, isRTL, t, isLoading: languageLoading } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/pages/login')
    }
  }, [status, router])

  // ✅ FIXED: Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true) // Auto-open on desktop
      } else {
        setSidebarOpen(false) // Auto-close on mobile
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isLoading = status === 'loading' || languageLoading

  // Loading state component - Beautiful logo splash screen
  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="flex flex-col items-center">
        {/* Logo with pulse + scale animation */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-2xl bg-blue-400/20 animate-ping" style={{ animationDuration: '2s' }} />
          {/* Inner glow ring */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-blue-400/10 to-purple-400/10 animate-pulse" style={{ animationDuration: '1.5s' }} />
          {/* Logo container */}
          <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white bg-white animate-[scaleIn_0.6s_ease-out]">
            <Image
              src="/malti-logo.png"
              alt="Malti Accounting"
              fill
              className="object-contain p-2"
              priority
            />
          </div>
        </div>
        {/* Loading dots */}
        <div className="flex gap-1.5 mt-8">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
        </div>
      </div>
      {/* Keyframe for scale-in animation */}
      <style jsx>{`
        @keyframes scaleIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )

  // Show loading for authentication and language
  if (isLoading) {
    return <LoadingSpinner />
  }

  // Show loading if no session (will redirect)
  if (!session) {
    return <LoadingSpinner />
  }

  // ✅ Build translation dictionary
  const dict = {
    nav: {
      dashboard: t('nav.dashboard', language === 'ar' ? 'لوحة التحكم' : 'Dashboard'),
      drivers: t('nav.drivers', language === 'ar' ? 'إدارة السائقين' : 'Drivers'),
      operations: t('nav.operations', language === 'ar' ? 'إدارة العمليات' : 'Operations'),
      platforms: t('nav.platforms', language === 'ar' ? 'منصات التوصيل' : 'Platforms'),
      deliveries: t('nav.deliveries', language === 'ar' ? 'الطلبات والتوصيلات' : 'Deliveries'),
      payroll: t('nav.payroll', language === 'ar' ? 'الرواتب والمدفوعات' : 'Payroll'),
      time: t('nav.time', language === 'ar' ? 'إدارة الوقت' : 'Time Tracking'),
      accounting: t('nav.accounting', language === 'ar' ? 'المحاسبة' : 'Accounting'),
      housing: t('nav.housing', language === 'ar' ? 'إدارة السكن' : 'Housing'),
      legal: t('nav.legal', language === 'ar' ? 'الشؤون القانونية' : 'Legal'),
      settings: t('nav.settings', language === 'ar' ? 'الإعدادات' : 'Settings'),
    },
    common: {
      search: t('common.search', language === 'ar' ? 'البحث...' : 'Search...'),
      profile: t('common.profile', language === 'ar' ? 'الملف الشخصي' : 'Profile'),
      signOut: t('common.signOut', language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'),
      menu: t('common.menu', language === 'ar' ? 'القائمة' : 'Menu'),
    }
  }

  // Simple layout without sidebar
  if (!showSidebar) {
    return (
      <div className={cn("min-h-screen bg-gray-50", isRTL && "rtl")}>
        {containerized ? (
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </div>
        ) : (
          <div className="p-6">
            {children}
          </div>
        )}
      </div>
    )
  }

  // ✅ FIXED: Calculate margins based on RTL and sidebar state
  const getMainContentClasses = () => {
    if (isRTL) {
      // Arabic/RTL: sidebar on right, content needs margin-right
      if (sidebarOpen) {
        return "lg:mr-80" // 320px margin-right when sidebar is open
      } else {
        return "lg:mr-20" // 80px margin-right when sidebar is collapsed
      }
    } else {
      // English/LTR: sidebar on left, content needs margin-left
      if (sidebarOpen) {
        return "lg:ml-80" // 320px margin-left when sidebar is open
      } else {
        return "lg:ml-20" // 80px margin-left when sidebar is collapsed
      }
    }
  }

  // ✅ FIXED: Proper layout with correct RTL handling
  return (
    <div className={cn("min-h-screen bg-gray-50", isRTL && "rtl")}>
      {/* ✅ Sidebar - Keep as fixed positioned (as in original) */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        locale={language}
        dict={dict}
        isRTL={isRTL}
      />

      {/* ✅ Main Content Area - FIXED RTL margin calculations */}
      <div className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        getMainContentClasses()
      )}>

        {/* ✅ Header - Proper height and positioning */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            session={session}
            locale={language}
            dict={dict}
            isRTL={isRTL}
            sidebarOpen={sidebarOpen}
          />
        </div>

        {/* ✅ Page Content - Account for header height */}
        <main className={cn(
          "min-h-[calc(100vh-4rem)]", // Subtract header height (64px = 4rem)
          containerized
            ? "container mx-auto px-4 py-6 max-w-7xl"
            : "p-6"
        )}>
          {children}
        </main>
      </div>

      {/* ✅ Mobile Overlay - Only show on mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

// Export layout variants
export function SimpleLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout showSidebar={false} containerized={true}>
      {children}
    </DashboardLayout>
  )
}

export function FullWidthLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout showSidebar={true} containerized={false}>
      {children}
    </DashboardLayout>
  )
}