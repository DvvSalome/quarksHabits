import { Loader2 } from 'lucide-react'

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const isPrimary = variant === 'primary'

  const variantStyles = {
    secondary: 'bg-stone-100 text-stone-700 hover:bg-stone-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
    ghost: 'text-stone-600 hover:bg-stone-100',
    outline: 'border border-stone-200 text-stone-700 hover:bg-stone-50',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center gap-2 font-medium overflow-hidden
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.97]
        ${sizes[size]}
        ${isPrimary ? 'text-white shadow-md shadow-violet-200/60 hover:shadow-lg hover:shadow-violet-300/60 hover:-translate-y-0.5' : (variantStyles[variant] || variantStyles.secondary)}
        ${className}
      `}
      style={
        isPrimary
          ? {
              background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #9333ea 100%)',
              backgroundSize: '200%',
            }
          : {}
      }
      {...props}
    >
      {/* Shimmer sweep on primary */}
      {isPrimary && !disabled && !loading && (
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s linear infinite',
          }}
        />
      )}

      {loading && <Loader2 className="w-4 h-4 animate-spin relative z-10" />}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}
