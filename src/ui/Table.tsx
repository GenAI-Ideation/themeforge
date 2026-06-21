import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from 'react'
import { cx } from './shared'

export interface TableRootProps extends TableHTMLAttributes<HTMLTableElement> {
  /** 모바일(좁은 화면)에서 행을 카드 더미로 스택. data-label 이 있는 td 만 라벨 표시 */
  stackOnMobile?: boolean
}

export function Table({ className, stackOnMobile, ...rest }: TableRootProps) {
  return (
    <div className="tf-table-wrap" data-stack={stackOnMobile ? '' : undefined}>
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

// ---------- 데이터 주도 테이블 ----------

export interface Column<Row> {
  /** 헤더 텍스트 — 모바일 스택 모드에서 셀 라벨로도 쓰인다 */
  header: ReactNode
  /** 셀 렌더러 */
  cell: (row: Row, index: number) => ReactNode
  /** 헤더 라벨(문자열) — header 가 ReactNode 일 때 data-label 용으로 지정 */
  label?: string
  align?: 'start' | 'end' | 'center'
  /** 모바일 스택 모드에서 라벨 칸 없이 값만 펼침(액션 버튼 열 등) */
  fullBleed?: boolean
}

export interface DataTableProps<Row> {
  columns: Column<Row>[]
  rows: Row[]
  rowKey: (row: Row, index: number) => string | number
  /** 기본 true — 좁은 화면에서 카드 스택으로 전환 */
  stackOnMobile?: boolean
  className?: string
}

const ALIGN_CSS = { start: 'left', center: 'center', end: 'right' } as const

/**
 * 데이터로 그리는 테이블 — 모바일 스택 모드의 셀 라벨(data-label)을
 * 컬럼 헤더에서 자동으로 채운다. 반응형 표를 손으로 라벨링할 필요가 없다.
 */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  stackOnMobile = true,
  className,
}: DataTableProps<Row>) {
  return (
    <Table stackOnMobile={stackOnMobile} className={className}>
      <THead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} style={col.align ? { textAlign: ALIGN_CSS[col.align] } : undefined}>
              {col.header}
            </th>
          ))}
        </tr>
      </THead>
      <TBody>
        {rows.map((row, ri) => (
          <tr key={rowKey(row, ri)}>
            {columns.map((col, ci) => {
              const label = col.fullBleed
                ? undefined
                : (col.label ?? (typeof col.header === 'string' ? col.header : undefined))
              return (
                <td
                  key={ci}
                  data-label={label}
                  style={col.align ? { textAlign: ALIGN_CSS[col.align] } : undefined}
                >
                  {col.cell(row, ri)}
                </td>
              )
            })}
          </tr>
        ))}
      </TBody>
    </Table>
  )
}
