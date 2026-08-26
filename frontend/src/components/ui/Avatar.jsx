import { cn } from '../../lib/utils'

export function Avatar({ src, alt, name, size = 'md', className = '', status, statusPosition = 'bottom-right' }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
  }

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  }

  const statusPositions = {
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
  }

  const initials = name ? getInitials(name) : '?'

  function getInitials(name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={cn('rounded-full bg-gray-100 object-cover', sizes[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-primary-100 flex items-center justify-center font-medium text-primary-700',
            sizes[size]
          )}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute rounded-full border-2 border-white',
            statusSizes[size],
            statusPositions[statusPosition],
            status === 'online' && 'bg-green-500',
            status === 'offline' && 'bg-gray-400',
            status === 'busy' && 'bg-red-500',
            status === 'away' && 'bg-yellow-500',
          )}
        />
      )}
    </div>
  )
}

export function AvatarGroup({ avatars = [], max = 5, size = 'md', className = '' }) {
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visible.map((avatar, index) => (
        <Avatar
          key={avatar.id || index}
          {...avatar}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex items-center justify-center bg-gray-100 text-gray-600 font-medium border-2 border-white',
            sizes[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}