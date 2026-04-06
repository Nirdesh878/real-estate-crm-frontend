export function Card({ className = '', children, ...props }) {
  return (
    <div 
      className={`bg-white rounded-2xl border border-dark-200 shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`px-6 py-5 border-b border-dark-100 bg-dark-50/50 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3 className={`font-heading font-semibold text-lg text-dark-900 tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}
