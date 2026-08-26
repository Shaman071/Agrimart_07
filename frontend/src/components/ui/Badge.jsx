import { cn } from '../../lib/utils'

export function Badge({ children, variant = 'default', size = 'md', className = '', dot = false, icon }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    farmer: 'bg-farmer-accent/20 text-farmer-text',
    outline: 'bg-transparent border border-gray-300 text-gray-600',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dot === true ? 'bg-current' : dot)} />}
      {icon && <span className="w-3 h-3">{icon}</span>}
      {children}
    </span>
  )
}

export function StatusBadge({ status, size = 'md' }) {
  const statusConfig = {
    pending: { label: 'Pending', variant: 'warning', icon: '⏳' },
    accepted: { label: 'Accepted', variant: 'success', icon: '✅' },
    dispatched: { label: 'Dispatched', variant: 'info', icon: '🚚' },
    completed: { label: 'Completed', variant: 'success', icon: '✅' },
    disputed: { label: 'Disputed', variant: 'danger', icon: '⚠️' },
    active: { label: 'Active', variant: 'success', icon: '🟢' },
    inactive: { label: 'Inactive', variant: 'default', icon: '⚪' },
    locked: { label: 'Locked', variant: 'warning', icon: '🔒' },
    released: { label: 'Released', variant: 'success', icon: '🔓' },
    refunded: { label: 'Refunded', variant: 'danger', icon: '💸' },
    open: { label: 'Open', variant: 'warning', icon: '📂' },
    resolved: { label: 'Resolved', variant: 'success', icon: '✅' },
    'picked up': { label: 'Picked Up', variant: 'info', icon: '📦' },
    'in transit': { label: 'In Transit', variant: 'info', icon: '🚚' },
    arrived: { label: 'Arrived', variant: 'success', icon: '📍' },
  }

  const config = statusConfig[status?.toLowerCase()] || { label: status, variant: 'default' }
  
  return (
    <Badge variant={config.variant} size={size}>
      {config.icon && <span aria-hidden="true">{config.icon}</span>}
      {config.label}
    </Badge>
  )
}

export function GradeBadge({ grade, size = 'md' }) {
  const variants = { A: 'success', B: 'warning', C: 'danger' }
  return <Badge variant={variants[grade] || 'default'} size={size}>{grade}</Badge>
}