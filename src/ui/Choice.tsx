import type { InputHTMLAttributes, ReactNode } from 'react'
import { cx } from './shared'
import type { Tone } from './shared'

interface ChoiceBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  tone?: Tone
  /** 우측 라벨 텍스트 */
  label?: ReactNode
}

export function Checkbox({ tone = 'brand', label, className, ...rest }: ChoiceBaseProps) {
  const input = (
    <input type="checkbox" className={cx('tf-checkbox', className)} data-tone={tone} {...rest} />
  )
  if (!label) return input
  return (
    <label className="tf-check-row">
      {input}
      <span>{label}</span>
    </label>
  )
}

export function Radio({ tone = 'brand', label, className, ...rest }: ChoiceBaseProps) {
  const input = (
    <input type="radio" className={cx('tf-radio', className)} data-tone={tone} {...rest} />
  )
  if (!label) return input
  return (
    <label className="tf-check-row">
      {input}
      <span>{label}</span>
    </label>
  )
}

export function Switch({ tone = 'brand', label, className, ...rest }: ChoiceBaseProps) {
  const input = (
    <input
      type="checkbox"
      role="switch"
      className={cx('tf-switch', className)}
      data-tone={tone}
      {...rest}
    />
  )
  if (!label) return input
  return (
    <label className="tf-check-row">
      {input}
      <span>{label}</span>
    </label>
  )
}
