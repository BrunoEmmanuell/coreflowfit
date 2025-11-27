import React from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: React.ReactNode
}

const VARIANT_MAP: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:from-sky-500 hover:to-indigo-500 focus:ring-4 focus:ring-sky-200',
  secondary:
    'bg-white border text-slate-700 hover:bg-slate-50 focus:ring-4 focus:ring-slate-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 focus:ring-4 focus:ring-rose-200',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
}

const SIZE_MAP: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-md',
  md: 'text-base px-4 py-2 rounded-lg',
  lg: 'text-lg px-5 py-3 rounded-xl',
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin inline-block', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
)

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, children, className, ...rest }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed',
          VARIANT_MAP[variant],
          SIZE_MAP[size],
          className
        )}
        disabled={isDisabled}
        aria-busy={loading ? 'true' : undefined}
        {...rest}
      >
        {loading && <Spinner className={cn(size === 'sm' ? 'w-4 h-4 mr-2' : size === 'md' ? 'w-5 h-5 mr-3' : 'w-6 h-6 mr-3')} />}
        <span className={cn(loading ? 'opacity-90' : 'opacity-100')}>{children}</span>
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
