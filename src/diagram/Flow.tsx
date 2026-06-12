/**
 * FlowDiagram — 순서도/상태 머신 렌더러.
 *
 * UI 컴포넌트와 똑같은 규칙을 따른다:
 *   - 시맨틱 토큰만 소비 (--tone-*, --radius-*, --border-width, --font-*, --dur-*)
 *   - 노드는 data-tone / data-variant 직교 좌표계 위에 있다 (tones.css 리매핑 재사용)
 * 그래서 테마를 갈아끼우면 다이어그램도 같이 다시 태어난다.
 */

import { useMemo, useRef } from 'react'
import type { ReactNode, SVGProps } from 'react'
import { cx } from '../ui/shared'
import { layoutFlow } from './layout'
import type { EdgeStyle, FlowDirection, FlowEdgeInput, FlowNodeInput, PlacedNode } from './layout'
import { useSvgUid } from './hooks'
import { useDiagramMetrics } from './measure'
import type { DiagramMetrics } from './measure'

export interface FlowDiagramProps extends Omit<SVGProps<SVGSVGElement>, 'direction'> {
  nodes: FlowNodeInput[]
  edges: FlowEdgeInput[]
  /** 흐름 방향 — down(위→아래) | right(왼쪽→오른쪽) */
  direction?: FlowDirection
  /** 간선 스타일 — smooth(곡선) | orthogonal(직각) */
  edgeStyle?: EdgeStyle
}

export function FlowDiagram({
  nodes,
  edges,
  direction = 'down',
  edgeStyle = 'smooth',
  className,
  ref,
  ...rest
}: FlowDiagramProps) {
  const inner = useRef<SVGSVGElement | null>(null)
  const metrics = useDiagramMetrics(inner)
  const uid = useSvgUid()

  const layout = useMemo(
    () => layoutFlow(nodes, edges, { direction, edgeStyle, metrics }),
    [nodes, edges, direction, edgeStyle, metrics],
  )
  const markerTones = useMemo(() => {
    const set = new Set<string>(['line'])
    edges.forEach((e) => e.tone && set.add(e.tone))
    return [...set]
  }, [edges])

  const setRef = (el: SVGSVGElement | null) => {
    inner.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref && typeof ref === 'object') (ref as { current: SVGSVGElement | null }).current = el
  }

  return (
    <svg
      ref={setRef}
      className={cx('tf-diagram tf-flow', className)}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      role="img"
      {...rest}
    >
      <defs>
        {markerTones.map((t) => (
          <marker
            key={t}
            id={`${uid}-arr-${t}`}
            data-tone={t === 'line' ? undefined : t}
            markerUnits="userSpaceOnUse"
            markerWidth="11"
            markerHeight="11"
            refX="9.5"
            refY="5.5"
            orient="auto-start-reverse"
          >
            <path d="M1 1.5 L9.5 5.5 L1 9.5 Z" className="tf-arrowhead" />
          </marker>
        ))}
      </defs>
      {layout.edges.map((e) => (
        <g
          key={e.key}
          className={cx('tf-flow-edge', e.tone && 'is-toned')}
          data-tone={e.tone}
          data-dashed={e.dashed ? '' : undefined}
          data-active={e.active ? '' : undefined}
        >
          <path className="tf-edge-line" d={e.path} markerEnd={`url(#${uid}-arr-${e.tone ?? 'line'})`} />
          {e.label && (
            <text className="tf-edge-label" x={e.labelX} y={e.labelY} textAnchor={e.labelAnchor}>
              {e.label}
            </text>
          )}
        </g>
      ))}
      {layout.nodes.map((n) => (
        <FlowNodeView key={n.id} node={n} metrics={metrics} />
      ))}
    </svg>
  )
}

function FlowNodeView({ node: n, metrics }: { node: PlacedNode; metrics: DiagramMetrics }) {
  const { w, h, kind } = n
  let shape: ReactNode
  switch (kind) {
    case 'decision':
      shape = <path className="tf-node-shape" d={`M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`} />
      break
    case 'io': {
      const s = Math.round(h * 0.32)
      shape = <path className="tf-node-shape" d={`M ${s} 0 L ${w} 0 L ${w - s} ${h} L 0 ${h} Z`} />
      break
    }
    case 'subroutine':
      shape = (
        <>
          <rect className="tf-node-shape" width={w} height={h} rx={Math.min(metrics.radius2, h / 2)} />
          <path className="tf-node-detail" d={`M 9 0 V ${h} M ${w - 9} 0 V ${h}`} />
        </>
      )
      break
    case 'terminal':
      // 시작/끝 노드: --radius-control 을 따른다 (pill 퍼스널리티 → 스타디움, sharp → 각짐)
      shape = <rect className="tf-node-shape" width={w} height={h} rx={Math.min(metrics.radiusControl, h / 2)} />
      break
    case 'state':
      shape = <rect className="tf-node-shape" width={w} height={h} rx={Math.min(metrics.radius3, h / 2)} />
      break
    case 'initial':
      shape = <circle className="tf-node-dot" cx={w / 2} cy={h / 2} r={w / 2} />
      break
    case 'final':
      shape = (
        <>
          <circle className="tf-node-ring" cx={w / 2} cy={h / 2} r={w / 2 - 1.5} />
          <circle className="tf-node-dot" cx={w / 2} cy={h / 2} r={w / 2 - 6} />
        </>
      )
      break
    default:
      shape = <rect className="tf-node-shape" width={w} height={h} rx={Math.min(metrics.radius2, h / 2)} />
  }

  const lines = n.label.lines
  const startY = h / 2 - ((lines.length - 1) * n.label.lineHeight) / 2
  const showLabel = lines.length > 0 && kind !== 'initial' && kind !== 'final'

  return (
    <g
      className="tf-flow-node"
      transform={`translate(${n.x} ${n.y})`}
      data-kind={kind}
      data-tone={n.tone ?? 'neutral'}
      data-variant={n.variant}
    >
      {shape}
      {showLabel && (
        <text x={w / 2} y={startY} textAnchor="middle">
          {lines.map((line, i) => (
            <tspan key={i} x={w / 2} y={startY + i * n.label.lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </g>
  )
}
