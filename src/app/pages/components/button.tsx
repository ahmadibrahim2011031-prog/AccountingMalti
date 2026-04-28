// src/components/ui/button.tsx - FIXED VERSION WITH CORRECT TYPES
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from '@/utils/utils'


const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-500",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500",
        outline:
          "border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-gray-500",
        secondary:
          "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 focus-visible:ring-gray-500",
        ghost:
          "text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500",
        link: 
          "text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500",
        success:
          "bg-green-600 text-white shadow-sm hover:bg-green-700 focus-visible:ring-green-500",
        warning:
          "bg-yellow-600 text-white shadow-sm hover:bg-yellow-700 focus-visible:ring-yellow-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-sm rounded-md",
        lg: "h-12 px-8 text-base rounded-lg",
        xl: "h-14 px-10 text-lg rounded-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    // ✅ FIXED: More explicit conditional rendering to avoid type issues
    const hasSpacing = Boolean(leftIcon || rightIcon || loading)

    return (
      <Comp
        // Default to type="button" to prevent accidental form submission
        {...(!asChild && !props.type && { type: "button" })}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        data-loading={loading}
        {...props}
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        
        {/* Left Icon */}
        {!loading && leftIcon && (
          <span className="flex-shrink-0">
            {leftIcon}
          </span>
        )}
        
        {/* Button Content */}
        {children && (
          <span className={cn(
            "flex-1",
            hasSpacing && "mx-1" // ✅ FIXED: Use explicit boolean instead of complex expression
          )}>
            {children}
          </span>
        )}
        
        {/* Right Icon */}
        {!loading && rightIcon && (
          <span className="flex-shrink-0">
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)

Button.displayName = "Button"

// Pre-configured button variants for common use cases
export const IconButton = React.forwardRef<
  HTMLButtonElement, 
  Omit<ButtonProps, 'leftIcon' | 'rightIcon'> & { icon: React.ReactNode }
>(({ icon, ...props }, ref) => (
  <Button ref={ref} size="icon" {...props}>
    {icon}
  </Button>
))

IconButton.displayName = "IconButton"

export const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { loadingText?: string }
>(({ children, loadingText, loading, ...props }, ref) => (
  <Button ref={ref} loading={loading} {...props}>
    {loading && loadingText ? loadingText : children}
  </Button>
))

LoadingButton.displayName = "LoadingButton"

// Enhanced button group component
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  size?: VariantProps<typeof buttonVariants>['size']
  variant?: VariantProps<typeof buttonVariants>['variant']
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = 'horizontal', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex",
        orientation === 'horizontal' 
          ? "rounded-md [&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button:not(:first-child)]:border-l-0"
          : "flex-col rounded-md [&>button]:rounded-none [&>button:first-child]:rounded-t-md [&>button:last-child]:rounded-b-md [&>button:not(:first-child)]:border-t-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

ButtonGroup.displayName = "ButtonGroup"

export { Button, buttonVariants }