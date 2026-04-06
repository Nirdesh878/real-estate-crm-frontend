export function Badge({ children, variant = 'default', className = '', ...props }) {
  const variants = {
    default: 'bg-dark-100 text-dark-800 border-dark-200',
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors'
  
  return (
    <span className={`${baseClasses} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </span>
  )
}
