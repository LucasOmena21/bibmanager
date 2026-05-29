import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

interface HelpTooltipProps {
  text: string
  variant?: 'default' | 'purple'
}

export const HelpTooltip = ({ text, variant = 'default' }: HelpTooltipProps) => {
  const [visible, setVisible] = useState(false)

  const iconClass = variant === 'purple'
    ? 'text-purple-400 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors'
    : 'text-muted-foreground hover:text-foreground transition-colors'

  const tooltipClass = variant === 'purple'
    ? 'absolute left-5 top-0 z-50 w-64 bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-700 rounded-md shadow-md px-3 py-2 text-xs leading-relaxed pointer-events-none'
    : 'absolute left-5 top-0 z-50 w-56 bg-popover text-popover-foreground border border-border rounded-md shadow-md px-3 py-2 text-xs leading-relaxed pointer-events-none'

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        className={iconClass}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label="Ajuda"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {visible && (
        <span role="tooltip" className={tooltipClass}>
          {text}
        </span>
      )}
    </span>
  )
}
