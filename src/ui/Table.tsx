import type { HTMLAttributes, TableHTMLAttributes } from 'react'
import { cx } from './shared'

export function Table({ className, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="tf-table-wrap">
      <table className={cx('tf-table', className)} {...rest} />
    </div>
  )
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />
}
