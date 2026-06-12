import type { ButtonHTMLAttributes } from 'react'
import { cx, Slot } from './shared'
import type { Size, Tone, Variant } from './shared'
import { Spinner } from './Misc'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  tone?: Tone
  size?: Size
  /** 정사각 아이콘 버튼 */
  iconOnly?: boolean
  /** 스피너 표시 + 클릭 차단 */
  loading?: boolean
  /** 자식 엘리먼트에 버튼 스타일을 입힌다 (<a> 등) */
  asChild?: boolean
}

export function Button({
  variant = 'solid',
  tone = 'brand',
  size = 'md',
  iconOnly,
  loading,
  asChild,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cx('tf-btn', className)}
      data-variant={variant}
      data-tone={tone}
      data-size={size}
      data-icon-only={iconOnly ? '' : undefined}
      data-loading={loading ? '' : undefined}
      disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </Comp>
  )
}
