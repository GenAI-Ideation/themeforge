/**
 * 다이어그램 ↔ 테마 토큰의 다리.
 *
 * SVG 레이아웃은 좌표 계산에 실제 수치가 필요하므로, CSS 변수를
 * getComputedStyle 로 읽어 숫자로 변환한다(useDiagramMetrics).
 * 덕분에 radius/density/borderWidth 퍼스널리티가 다이어그램의
 * 노드 모서리·간격·선 굵기에 그대로 흘러든다.
 *
 * 텍스트 측정은 canvas measureText — 동기적이고 폰트 정확.
 */

import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'

export interface MeasuredText {
  lines: string[]
  w: number
  h: number
  lineHeight: number
}

let sharedCtx: CanvasRenderingContext2D | null = null

function getCtx(): CanvasRenderingContext2D | null {
  if (sharedCtx) return sharedCtx
  if (typeof document === 'undefined') return null
  sharedCtx = document.createElement('canvas').getContext('2d')
  return sharedCtx
}

export function measureLines(text: string, font: string, leading = 1.3): MeasuredText {
  const lines = text ? text.split('\n') : []
  const size = parseFloat(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? '13')
  const lineHeight = Math.round(size * leading)
  const ctx = getCtx()
  let w = 0
  for (const line of lines) {
    if (ctx) {
      ctx.font = font
      w = Math.max(w, ctx.measureText(line).width)
    } else {
      // 캔버스가 없을 때(SSR)의 추정: CJK ≈ 1em, 라틴 ≈ 0.55em
      let est = 0
      for (const ch of line) est += ch.charCodeAt(0) > 0x2e80 ? size : size * 0.55
      w = Math.max(w, est)
    }
  }
  return { lines, w: Math.ceil(w), h: lines.length * lineHeight, lineHeight }
}

export interface DiagramMetrics {
  /** --space-unit (px) — 밀도 퍼스널리티에 비례 */
  unit: number
  /** --border-width (px) */
  borderWidth: number
  /** --radius-control (px) — terminal/stadium 노드 모서리 */
  radiusControl: number
  /** --radius-2 (px) — process 노드 모서리 */
  radius2: number
  /** --radius-3 (px) — state 노드 모서리 */
  radius3: number
  /** svg에 적용된 본문 폰트 스택(해결된 값) */
  fontBody: string
}

export const FALLBACK_METRICS: DiagramMetrics = {
  unit: 4,
  borderWidth: 1,
  radiusControl: 8,
  radius2: 8,
  radius3: 14,
  fontBody: 'system-ui, sans-serif',
}

function same(a: DiagramMetrics, b: DiagramMetrics): boolean {
  return (
    a.unit === b.unit &&
    a.borderWidth === b.borderWidth &&
    a.radiusControl === b.radiusControl &&
    a.radius2 === b.radius2 &&
    a.radius3 === b.radius3 &&
    a.fontBody === b.fontBody
  )
}

/**
 * 렌더마다 토큰을 다시 읽되(값 비교로 setState 가드) 테마/모드/랩 슬라이더
 * 변경이 부모 리렌더를 유발하므로 별도 구독 없이도 항상 동기화된다.
 */
export function useDiagramMetrics(ref: RefObject<SVGSVGElement | null>): DiagramMetrics {
  const [metrics, setMetrics] = useState(FALLBACK_METRICS)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const cs = getComputedStyle(el)
    const num = (name: string, fallback: number) => {
      const v = parseFloat(cs.getPropertyValue(name))
      return Number.isFinite(v) ? v : fallback
    }
    const next: DiagramMetrics = {
      unit: num('--space-unit', FALLBACK_METRICS.unit),
      borderWidth: num('--border-width', FALLBACK_METRICS.borderWidth),
      radiusControl: num('--radius-control', FALLBACK_METRICS.radiusControl),
      radius2: num('--radius-2', FALLBACK_METRICS.radius2),
      radius3: num('--radius-3', FALLBACK_METRICS.radius3),
      fontBody: cs.fontFamily || FALLBACK_METRICS.fontBody,
    }
    setMetrics((prev) => (same(prev, next) ? prev : next))
  })
  return metrics
}
