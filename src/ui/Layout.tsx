/**
 * 반응형 레이아웃 프리미티브 — Container · Stack · Grid · Cluster.
 *
 * 디자인 시스템이 "모바일 대응"을 말하려면 색·컴포넌트만으로는 부족하다.
 * 소비자가 반응형 레이아웃을 짤 도구가 필요하다. 이 프리미티브들은
 * **반응형 prop**(`{ base, sm, md, lg, xl }`)을 받아 브레이크포인트별
 * 커스텀 프로퍼티로 방출하고, layout.css가 미디어 쿼리로 소비한다.
 * → JS 미디어 쿼리 0개, SSR 안전, 토큰(간격)만 소비.
 *
 *   <Stack direction={{ base: 'column', md: 'row' }} gap={4}>  // 모바일 세로 → md 가로
 *   <Grid cols={{ base: 1, sm: 2, lg: 3 }} gap={4}>            // 1열 → 2열 → 3열
 *   <Grid min="240px">                                         // 컨테이너에 맞춰 자동 줄바꿈
 */

import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from './shared'

export type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl'
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>

const SPACE = (step: number) => `var(--space-${step})`
const ALIGN: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
}
const JUSTIFY: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
}

function isBreakpointMap<T>(v: unknown): v is Partial<Record<Breakpoint, T>> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** 반응형 값을 `--<name>-<bp>` 커스텀 프로퍼티 묶음으로 변환 */
function rvars<T>(
  name: string,
  value: Responsive<T> | undefined,
  transform: (v: T) => string,
): Record<string, string> {
  if (value == null) return {}
  const out: Record<string, string> = {}
  if (isBreakpointMap<T>(value)) {
    for (const [bp, v] of Object.entries(value)) {
      if (v != null) out[`--${name}-${bp}`] = transform(v as T)
    }
  } else {
    out[`--${name}-base`] = transform(value)
  }
  return out
}

type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
type Justify = 'start' | 'center' | 'end' | 'between' | 'around'

// ---------- Stack ----------

export interface StackProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  direction?: Responsive<'row' | 'column'>
  gap?: Responsive<number>
  align?: Responsive<Align>
  justify?: Responsive<Justify>
  wrap?: boolean
  children?: ReactNode
}

export function Stack({
  as: Tag = 'div',
  direction,
  gap = 4,
  align,
  justify,
  wrap,
  className,
  style,
  children,
  ...rest
}: StackProps) {
  const vars = {
    ...rvars('stk-dir', direction, (v) => v),
    ...rvars('stk-gap', gap, SPACE),
    ...rvars('stk-align', align, (v) => ALIGN[v]),
    ...rvars('stk-justify', justify, (v) => JUSTIFY[v]),
  }
  return (
    <Tag
      className={cx('tf-stack', className)}
      data-wrap={wrap ? '' : undefined}
      style={{ ...(vars as CSSProperties), ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

// ---------- Grid ----------

export interface GridProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  /** 고정 열 수(반응형). 생략하면 min 기반 자동 줄바꿈 */
  cols?: Responsive<number>
  /** cols 미지정 시 auto-fit minmax 최소 폭. 컨테이너에 맞춰 본질적으로 반응형 */
  min?: string
  gap?: Responsive<number>
  align?: Responsive<Align>
  children?: ReactNode
}

export function Grid({
  as: Tag = 'div',
  cols,
  min = '240px',
  gap = 4,
  align,
  className,
  style,
  children,
  ...rest
}: GridProps) {
  const vars = {
    ...rvars('grd-cols', cols, (v) => `repeat(${v}, minmax(0, 1fr))`),
    ...rvars('grd-gap', gap, SPACE),
    ...rvars('grd-align', align, (v) => ALIGN[v]),
    '--grd-min': min,
  }
  return (
    <Tag
      className={cx('tf-grid', className)}
      data-auto={cols == null ? '' : undefined}
      style={{ ...(vars as CSSProperties), ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

// ---------- Cluster (줄바꿈 가로 묶음) ----------

export interface ClusterProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  gap?: Responsive<number>
  align?: Responsive<Align>
  justify?: Responsive<Justify>
  children?: ReactNode
}

export function Cluster({
  as: Tag = 'div',
  gap = 3,
  align = 'center',
  justify,
  className,
  style,
  children,
  ...rest
}: ClusterProps) {
  const vars = {
    ...rvars('clu-gap', gap, SPACE),
    ...rvars('clu-align', align, (v) => ALIGN[v]),
    ...rvars('clu-justify', justify, (v) => JUSTIFY[v]),
  }
  return (
    <Tag
      className={cx('tf-cluster', className)}
      style={{ ...(vars as CSSProperties), ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

// ---------- Container ----------

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  /** 최대 폭 — sm 640 · md 768 · lg 1024 · xl 1200 · full 무제한 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** 좌우 거터(유체 패딩 + safe-area). 기본 true */
  gutter?: boolean
  children?: ReactNode
}

export function Container({
  as: Tag = 'div',
  size = 'lg',
  gutter = true,
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <Tag
      className={cx('tf-container', className)}
      data-size={size}
      data-gutter={gutter ? '' : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
