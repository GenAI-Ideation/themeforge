import type { HTMLAttributes } from 'react'
import { cx } from './shared'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** hover 리프트 + 커서 (클릭 가능한 카드) */
  interactive?: boolean
}

export function Card({ interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cx('tf-card', className)}
      data-interactive={interactive ? '' : undefined}
      {...rest}
    />
  )
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('tf-card__header', className)} {...rest} />
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cx('tf-card__title', className)} {...rest} />
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx('tf-card__desc', className)} {...rest} />
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('tf-card__body', className)} {...rest} />
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('tf-card__footer', className)} {...rest} />
}
