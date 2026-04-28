// src/layout/Sidebar.tsx
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image' // Import Image component
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Calculator,
  LogOut,
  BookOpen,
} from 'lucide-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/utils/LanguageContext'

import { cn } from '@/utils/utils'

function hasModuleAccess(userRole: string, moduleId: string): boolean {
  return ['accounting', 'logout'].includes(moduleId)
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  locale: string
  dict: any // Dict is not used in the provided code, consider removing if truly unused.
  isRTL: boolean
}

interface MenuItem {
  readonly id: string
  readonly href: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly enText: string
  readonly arText: string
  readonly isAction?: boolean
}

const STATIC_MENU_STRUCTURE: MenuItem[] = [
  {
    id: 'accounting',
    href: '/pages/accounting',
    icon: Calculator,
    enText: 'Accounting',
    arText: 'المحاسبة',
  },
  {
    id: 'logout',
    href: '#',
    icon: LogOut,
    enText: 'Sign Out',
    arText: 'تسجيل الخروج',
    isAction: true,
  },
]

interface ProcessedMenuItem extends MenuItem {
  current: boolean
  displayText: string
  onClick?: () => void
}

// Dedicated Logo Component for Sidebar
// It renders the logo Image or a Truck icon as fallback.
// Size is passed to Image, and object-contain is used to ensure logo fits.
const SidebarLogo: React.FC<{ size: number }> = ({ size }) => {
  const [logoError, setLogoError] = useState(false);

  // If there's an error loading the image, display a default Truck icon
  if (logoError) {
    return (
      <BookOpen className="w-7 h-7 text-blue-600" />
    );
  }

  return (
    <Image
      src="/malti-logo.png"
      alt="Malti Accounting Logo"
      width={size}
      height={size}
      className="object-contain" // Use object-contain to scale the image without cropping
      sizes={`${size}px`} // Provide sizes prop for Next/Image optimization
      onError={() => setLogoError(true)} // Set error state if image fails to load
      priority // Prioritize loading for faster display
    />
  );
};


export function Sidebar({ isOpen, onToggle, locale, dict, isRTL }: SidebarProps) {
  const pathname = usePathname()
  const { language, isLoading } = useLanguage()
  const { data: session } = useSession()

  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: '/pages/login',
        redirect: true
      })
    } catch (error) {
      console.error('Sign out error:', error)
      window.location.href = '/pages/login'
    }
  }

  const isCurrentPath = (itemHref: string, itemId: string): boolean => {
    if (!pathname) return false
    if (itemId === 'logout') return false
    if (pathname === itemHref) return true
    if (itemHref !== '/pages/dashboard' && pathname.startsWith(itemHref)) return true
    return false
  }

  const menuItems = useMemo((): ProcessedMenuItem[] => {
    return STATIC_MENU_STRUCTURE
      .filter(item => {
        if (!session?.user?.role) return true // Show all if no session (for loading state)
        if (item.id === 'logout') return true // Always show logout
        return hasModuleAccess(session.user.role, item.id)
      })
      .map(item => ({
        ...item,
        current: isCurrentPath(item.href, item.id),
        displayText: language === 'ar' ? item.arText : item.enText,
        onClick: item.isAction && item.id === 'logout' ? handleLogout : undefined
      }))
  }, [pathname, language, session?.user?.role])

  if (isLoading) {
    return (
      <div
        className={cn(
          // Removed all border classes for the sidebar itself
          "fixed inset-y-0 z-50 flex flex-col bg-white transition-all duration-300",
          isOpen ? "w-80" : "w-20",
          isRTL ? "right-0" : "left-0"
        )}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
          {isOpen && (
            <div className="flex items-center">
              {/* Skeleton for Logo container */}
              <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="ml-4">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          )}
          {!isOpen && (
            // Skeleton for Logo container when sidebar is closed
            <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse mx-auto"></div>
          )}

          <button
            onClick={onToggle}
            className={cn(
              "p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0",
              isOpen && isRTL ? "mr-2" : isOpen && !isRTL ? "ml-2" : ""
            )}
          >
            {isRTL ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {Array.from({ length: 11 }).map((_, index) => (
            <div key={index} className={cn(
              "flex items-center px-4 py-3 rounded-xl",
              !isOpen && "justify-center px-2"
            )}>
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              {isOpen && (
                <div className="ml-4 h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              )}
            </div>
          ))}
        </nav>
      </div>
    )
  }

  return (
    <div
      className={cn(
        // Removed all border classes for the sidebar itself
        "fixed inset-y-0 z-50 flex flex-col bg-white transition-all duration-300",
        isOpen ? "w-80" : "w-20",
        isRTL ? "right-0" : "left-0"
      )}
    >
      <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
        {isOpen && (
          <div className={cn(
            "flex items-center w-full",
            isRTL ? "flex-row-reverse" : "flex-row"
          )}>
            {/* Logo container - bigger size without border */}
            <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
              <SidebarLogo size={64} /> {/* Logo size increased to 64px within the 64px square container */}
            </div>
            <div className={cn(
              "flex-1 min-w-0",
              isRTL ? "mr-4 text-right" : "ml-4 text-left"
            )}>
              <div className={cn(
                "font-bold text-gray-900 leading-tight truncate",
                language === 'ar' ? "text-lg" : "text-lg"
              )}>
                {language === 'ar' ? 'مالتي للمحاسبة' : 'Malti Accounting'}
              </div>
              <div className={cn(
                "text-gray-600 leading-tight mt-1 truncate",
                language === 'ar' ? "text-sm" : "text-sm"
              )}>
                {language === 'ar' ? 'نظام المحاسبة' : 'Accounting System'}
              </div>
            </div>
          </div>
        )}

        {!isOpen && (
          // Logo container - bigger size without border when sidebar is closed
          <div className="w-16 h-16 flex items-center justify-center mx-auto">
            <SidebarLogo size={64} /> {/* Logo size increased to 64px within the 64px square container */}
          </div>
        )}

        <button
          onClick={onToggle}
          className={cn(
            "p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0",
            isOpen && isRTL ? "mr-2" : isOpen && !isRTL ? "ml-2" : ""
          )}
        >
          {isOpen ? (
            isRTL ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />
          ) : (
            isRTL ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />
          )}
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon

          if (item.isAction && item.id === 'logout') {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  "group flex items-center w-full text-sm font-medium rounded-xl transition-all duration-200",
                  "text-red-600 hover:text-red-700 hover:bg-red-50",
                  isOpen ? (
                    isRTL ? "px-4 py-3 flex-row-reverse" : "px-4 py-3"
                  ) : "justify-center px-2 py-3"
                )}
              >
                <Icon
                  className={cn(
                    "flex-shrink-0 w-6 h-6 text-red-500 group-hover:text-red-600",
                    isOpen && (isRTL ? "ml-3" : "mr-3")
                  )}
                />
                {isOpen && (
                  <span className={cn(
                    "flex-1 truncate",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    {item.displayText}
                  </span>
                )}
              </button>
            )
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group flex items-center text-sm font-medium rounded-xl transition-all duration-200",
                item.current
                  ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-r-4 border-blue-600 shadow-sm"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50",
                isOpen ? (
                  isRTL ? "px-4 py-3 flex-row-reverse" : "px-4 py-3"
                ) : "justify-center px-2 py-3"
              )}
            >
              <Icon
                className={cn(
                  "flex-shrink-0 w-6 h-6",
                  item.current ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600",
                  isOpen && (isRTL ? "ml-3" : "mr-3")
                )}
              />
              {isOpen && (
                <span className={cn(
                  "flex-1 truncate",
                  isRTL ? "text-right" : "text-left"
                )}>
                  {item.displayText}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className={cn(
            "text-center",
            isRTL ? "text-right" : "text-left"
          )}>
            <p className="text-xs text-gray-500">
              {language === 'ar' ? 'الإصدار 1.0.0' : 'Version 1.0.0'}
            </p>
            {session?.user && (
              <p className="text-xs text-blue-600 mt-1">
                {session.user.role} - {session.user.name}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}