import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

export function Dropdown({ trigger, items, align = 'right', className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className={cn(
        'fixed z-50 mt-2 min-w-[180px] bg-white rounded-xl border border-gray-200 shadow-lg',
        'animate-fade-in',
        align === 'right' && 'right-0',
        align === 'left' && 'left-0',
        className
      )}
      role="menu"
    >
      <div className="py-1">
        {items.map((item, index) => (
          <button
            key={item.key || index}
            onClick={() => {
              item.onClick?.()
              if (!item.keepOpen) setIsOpen(false)
            }}
            disabled={item.disabled}
            className={cn(
              'w-full px-4 py-2.5 text-sm text-left transition-colors',
              'focus:outline-none focus:bg-gray-50',
              item.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50',
              item.danger && 'text-red-600 hover:bg-red-50'
            )}
            role="menuitem"
            tabIndex={-1}
          >
            {item.icon && <span className="inline-flex w-5 h-5 mr-2">{item.icon}</span>}
            {item.label}
            {item.shortcut && <span className="ml-auto text-xs text-gray-400">{item.shortcut}</span>}
          </button>
        ))}
      </div>
    </div>
  ) : null

  return (
    <div className="relative inline-block" ref={triggerRef}>
      {typeof trigger === 'function' ? trigger({ isOpen, toggle: () => setIsOpen(!isOpen) }) : trigger}
      {createPortal(dropdownContent, document.body)}
    </div>
  )
}

export function DropdownItem({ label, onClick, icon, danger = false, disabled = false, shortcut, keepOpen = false }) {
  return { label, onClick, icon, danger, disabled, shortcut, keepOpen }
}