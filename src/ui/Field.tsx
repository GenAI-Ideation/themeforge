import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'
import { cx } from './shared'

type InputVariant = 'outline' | 'soft' | (string & {})

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant
  invalid?: boolean
}

export function Input({ variant = 'outline', invalid, className, ...rest }: InputProps) {
  return (
    <input
      className={cx('tf-input', className)}
      data-variant={variant}
      data-invalid={invalid ? '' : undefined}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: InputVariant
  invalid?: boolean
}

export function Textarea({ variant = 'outline', invalid, className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cx('tf-input', className)}
      data-variant={variant}
      data-invalid={invalid ? '' : undefined}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: InputVariant
  invalid?: boolean
}

export function Select({ variant = 'outline', invalid, className, children, ...rest }: SelectProps) {
  return (
    <span className="tf-select-wrap">
      <select
        className={cx('tf-input', className)}
        data-variant={variant}
        data-invalid={invalid ? '' : undefined}
        {...rest}
      >
        {children}
      </select>
    </span>
  )
}

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cx('tf-label', className)} {...rest} />
}

export interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  className?: string
  /** (id) => 컨트롤 — label 연결용 id를 넘겨준다 */
  children: (id: string) => ReactNode
}

/** Label + 컨트롤 + 힌트/에러를 묶는 폼 행 */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId()
  return (
    <div className={cx('tf-field', className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      {children(id)}
      {error ? (
        <span className="tf-error" role="alert">{error}</span>
      ) : (
        hint && <span className="tf-hint">{hint}</span>
      )}
    </div>
  )
}
