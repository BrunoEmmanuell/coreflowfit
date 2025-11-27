import React from 'react'
import { cn } from '@/utils/cn' // caso não exista, posso gerar também

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string | boolean
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      leftIcon,
      rightIcon,
      disabled,
      className,
      ...rest
    },
    ref
  ) => {
    const state = error ? 'error' : success ? 'success' : 'default'

    const baseStyles =
      'w-full px-3 py-2 rounded-lg border bg-white text-sm transition-all focus:outline-none'

    const stateStyles = {
      default:
        'border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200',
      error:
        'border-rose-500 text-rose-600 placeholder-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-200',
      success:
        'border-green-500 text-green-600 placeholder-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-200',
    }

    const disabledStyles =
      'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-slate-500 flex items-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              baseStyles,
              stateStyles[state],
              disabled && disabledStyles,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...rest}
          />

          {rightIcon && (
            <span className="absolute right-3 text-slate-500 flex items-center">
              {rightIcon}
            </span>
          )}
        </div>

        {typeof error === 'string' && (
          <span className="text-xs text-rose-600">{error}</span>
        )}

        {success && !error && (
          <span className="text-xs text-green-600">Tudo certo!</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
