import type { DialogHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { cx } from './shared'

export interface DialogProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>, 'open'> {
  open: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * 네이티브 <dialog> 기반 모달 — 포커스 트랩과 ESC 닫기는 브라우저가 처리한다.
 * 백드롭 클릭 닫기만 직접 구현.
 */
export function Dialog({ open, onClose, className, children, ...rest }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === ref.current) onClose()
    },
    [onClose],
  )

  return (
    <dialog
      ref={ref}
      className={cx('tf-dialog', className)}
      onClose={onClose}
      onClick={onClick}
      {...rest}
    >
      <div className="tf-dialog__inner">{children}</div>
    </dialog>
  )
}

export function DialogTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cx('tf-dialog__title', className)} {...rest} />
}

export function DialogDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx('tf-dialog__desc', className)} {...rest} />
}

export function DialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('tf-dialog__footer', className)} {...rest} />
}
