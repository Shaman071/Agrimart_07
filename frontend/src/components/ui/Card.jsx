import { cn } from '../../lib/utils'

export function Card({ children, className = '', variant = 'default', padding = 'lg', ...props }) {
  const variants = {
    default: 'bg-white border border-gray-100 shadow-sm',
    elevated: 'bg-white border border-gray-100 shadow-lg',
    outlined: 'bg-white border-2 border-gray-200',
    farmer: 'bg-farmer-bg border-2 border-farmer-accent shadow-lg',
    admin: 'bg-gray-900 border border-gray-700',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  }

  return (
    <div
      className={cn(
        'rounded-2xl transition-shadow duration-200',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', action, title, description }) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>
        {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  )
}

export function CardContent({ children, className = '' }) {
  return <div className={cn(className)}>{children}</div>
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={cn('flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100', className)}>
      {children}
    </div>
  )
}