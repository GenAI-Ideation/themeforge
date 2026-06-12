import type { HTMLAttributes } from 'react'
import { cx } from './shared'
import type { Tone, Variant } from './shared'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Extract<Variant, 'solid' | 'soft' | 'outline'> | (string & {})
  tone?: Tone
  /** 상태 점 표시 */
  dot?: boolean
}

export function Badge({
  variant = 'soft',
  tone = 'neutral',
  dot,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cx('tf-badge', className)}
      data-variant={variant}
      data-tone={tone}
      {...rest}
    >
      {dot && <span className="tf-badge__dot" aria-hidden />}
      {children}
    </span>
  )
}
