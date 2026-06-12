import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './shared'
import type { Tone, Variant } from './shared'

const DEFAULT_ICONS: Record<string, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  danger: '✕',
  brand: '★',
  accent: '★',
  neutral: '•',
}

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: Tone
  variant?: Extract<Variant, 'solid' | 'soft' | 'outline'> | (string & {})
  title?: ReactNode
  icon?: ReactNode
}

export function Alert({
  tone = 'info',
  variant = 'soft',
  title,
  icon,
  className,
  children,
  ...rest
}: AlertProps) {
  return (
    <div
      role="status"
      className={cx('tf-alert', className)}
      data-tone={tone}
      data-variant={variant}
      {...rest}
    >
      <span className="tf-alert__icon" aria-hidden>
        {icon ?? DEFAULT_ICONS[tone] ?? '•'}
      </span>
      <div>
        {title && <div className="tf-alert__title">{title}</div>}
        {children}
      </div>
    </div>
  )
}
