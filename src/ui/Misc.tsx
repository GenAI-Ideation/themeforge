import type { CSSProperties, HTMLAttributes } from 'react'
import { cx } from './shared'
import type { Size, Tone } from './shared'

// ----- Spinner -----

export function Spinner({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx('tf-spinner', className)} aria-hidden {...rest} />
}

// ----- Avatar -----

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string
  src?: string
  size?: Size
  tone?: Tone
}

export function Avatar({ name, src, size = 'md', tone = 'brand', className, ...rest }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className={cx('tf-avatar', className)}
      data-size={size}
      data-tone={tone}
      title={name}
      {...rest}
    >
      {src ? <img src={src} alt={name} /> : initials}
    </span>
  )
}

// ----- Progress -----

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  tone?: Tone
}

export function Progress({ value, max = 100, tone = 'brand', className, ...rest }: ProgressProps) {
  const ratio = Math.min(1, Math.max(0, value / max))
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cx('tf-progress', className)}
      data-tone={tone}
      {...rest}
    >
      <div className="tf-progress__fill" style={{ width: `${ratio * 100}%` }} />
    </div>
  )
}

// ----- Skeleton -----

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
}

export function Skeleton({ width, height = 16, style, className, ...rest }: SkeletonProps) {
  return (
    <div
      className={cx('tf-skeleton', className)}
      style={{ width, height, ...style }}
      aria-hidden
      {...rest}
    />
  )
}

// ----- Separator -----

export interface SeparatorProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical'
}

export function Separator({ orientation = 'horizontal', className, ...rest }: SeparatorProps) {
  return (
    <hr
      className={cx('tf-separator', className)}
      data-orientation={orientation}
      aria-orientation={orientation}
      {...rest}
    />
  )
}

// ----- Kbd -----

export function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <kbd className={cx('tf-kbd', className)} {...rest} />
}

// ----- Tooltip (CSS 전용 래퍼) -----

export interface TooltipProps extends HTMLAttributes<HTMLSpanElement> {
  content: string
}

export function Tooltip({ content, className, children, ...rest }: TooltipProps) {
  return (
    <span className={cx('tf-tip', className)} data-tip={content} tabIndex={0} {...rest}>
      {children}
    </span>
  )
}
