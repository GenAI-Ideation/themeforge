/**
 * SequenceDiagram — 액터 · 라이프라인 · 메시지 · 활성 구간.
 *
 * 메시지 종류: sync(실선+꽉 찬 화살촉) · async(빈 화살촉) · return(점선+빈 화살촉)
 * · self(from === to 면 자동으로 루프).
 * 활성 구간(activation bar)은 호출 스택 휴리스틱으로 자동 계산된다:
 * sync 가 대상 액터를 활성화하고, 그 액터의 return 이 닫는다.
 */

import { useMemo, useRef } from 'react'
import type { SVGProps } from 'react'
import { cx } from '../ui/shared'
import type { Tone } from '../ui/shared'
import { roundedPath } from './layout'
import { measureLines, useDiagramMetrics } from './measure'
import { useSvgUid } from './hooks'

export interface SequenceActorInput {
  id: string
  label: string
  tone?: Tone
}

export type SequenceMessageKind = 'sync' | 'async' | 'return'

export interface SequenceMessageInput {
  from: string
  to: string
  label?: string
  kind?: SequenceMessageKind
  tone?: Tone
}

export interface SequenceDiagramProps extends SVGProps<SVGSVGElement> {
  actors: SequenceActorInput[]
  messages: SequenceMessageInput[]
}

const PAD = 16

interface PlacedActor {
  input: SequenceActorInput
  cx: number
  boxW: number
  boxH: number
  label: ReturnType<typeof measureLines>
}

interface PlacedMessage {
  input: SequenceMessageInput
  fromIdx: number
  toIdx: number
  kind: SequenceMessageKind | 'self'
  y: number
}

interface ActivationBar {
  actor: number
  y0: number
  y1: number
  depth: number
}

export function SequenceDiagram({ actors, messages, className, ref, ...rest }: SequenceDiagramProps) {
  const inner = useRef<SVGSVGElement | null>(null)
  const metrics = useDiagramMetrics(inner)
  const uid = useSvgUid()

  const layout = useMemo(() => {
    const actorFont = `600 13px ${metrics.fontBody}`
    const msgFont = `12px ${metrics.fontBody}`

    // ---- 액터 열 배치
    const placed: PlacedActor[] = actors.map((a) => {
      const label = measureLines(a.label, actorFont)
      return {
        input: a,
        cx: 0,
        boxW: Math.max(88, label.w + 28),
        boxH: Math.max(36, label.h + 16),
        label,
      }
    })
    const index = new Map(actors.map((a, i) => [a.id, i]))

    // 인접 열 사이 최소 간격: 박스 절반들 + 그 사이를 지나는 메시지 라벨 폭
    const need: number[] = []
    for (let i = 0; i + 1 < placed.length; i++) {
      need.push(Math.max(150, placed[i].boxW / 2 + placed[i + 1].boxW / 2 + 36))
    }
    for (const m of messages) {
      const f = index.get(m.from)
      const t = index.get(m.to)
      if (f == null || t == null || f === t || Math.abs(f - t) !== 1 || !m.label) continue
      const lw = measureLines(m.label, msgFont).w
      const lo = Math.min(f, t)
      need[lo] = Math.max(need[lo], lw + 52)
    }
    if (placed.length > 0) {
      placed[0].cx = PAD + placed[0].boxW / 2
      for (let i = 1; i < placed.length; i++) placed[i].cx = placed[i - 1].cx + need[i - 1]
    }

    // ---- 메시지 행 배치
    const boxBottom = PAD + Math.max(0, ...placed.map((a) => a.boxH))
    let y = boxBottom + 34
    let selfOnLast = false
    const msgs: PlacedMessage[] = []
    for (const m of messages) {
      const f = index.get(m.from)
      const t = index.get(m.to)
      if (f == null || t == null) {
        console.warn(`[SequenceDiagram] 알 수 없는 액터의 메시지 무시: ${m.from} → ${m.to}`)
        continue
      }
      const kind: PlacedMessage['kind'] = f === t ? 'self' : (m.kind ?? 'sync')
      msgs.push({ input: m, fromIdx: f, toIdx: t, kind, y })
      if (kind === 'self' && f === placed.length - 1) selfOnLast = true
      y += kind === 'self' ? 48 : m.label ? 38 : 30
    }
    const endY = y - 4

    // ---- 활성 구간: 호출 스택 휴리스틱
    const stacks = placed.map(() => [] as Array<{ y: number; depth: number }>)
    const bars: ActivationBar[] = []
    for (const m of msgs) {
      if (m.kind === 'return') {
        const opened = stacks[m.fromIdx].pop()
        if (opened) bars.push({ actor: m.fromIdx, y0: opened.y, y1: m.y, depth: opened.depth })
      } else if (m.kind === 'sync') {
        const st = stacks[m.toIdx]
        st.push({ y: m.y, depth: st.length })
      }
    }
    stacks.forEach((st, ai) =>
      st.forEach((opened) => bars.push({ actor: ai, y0: opened.y, y1: endY - 10, depth: opened.depth })),
    )

    const last = placed[placed.length - 1]
    const width = (last ? last.cx + last.boxW / 2 : PAD) + (selfOnLast ? 56 : 0) + PAD
    const height = endY + PAD
    return { actors: placed, msgs, bars, boxBottom, endY, width: Math.ceil(width), height: Math.ceil(height) }
  }, [actors, messages, metrics])

  const markerTones = useMemo(() => {
    const set = new Set<string>(['line'])
    messages.forEach((m) => m.tone && set.add(m.tone))
    return [...set]
  }, [messages])

  const setRef = (el: SVGSVGElement | null) => {
    inner.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref && typeof ref === 'object') (ref as { current: SVGSVGElement | null }).current = el
  }

  return (
    <svg
      ref={setRef}
      className={cx('tf-diagram tf-sequence', className)}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      role="img"
      {...rest}
    >
      <defs>
        {markerTones.map((t) => (
          <g key={t}>
            <marker
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
            <marker
              id={`${uid}-open-${t}`}
              data-tone={t === 'line' ? undefined : t}
              markerUnits="userSpaceOnUse"
              markerWidth="11"
              markerHeight="11"
              refX="9"
              refY="5.5"
              orient="auto-start-reverse"
            >
              <path d="M1.5 1.5 L9 5.5 L1.5 9.5" className="tf-arrowhead-open" />
            </marker>
          </g>
        ))}
      </defs>

      {/* 라이프라인 */}
      {layout.actors.map((a) => (
        <line
          key={a.input.id}
          className="tf-seq-lifeline"
          x1={a.cx}
          y1={layout.boxBottom}
          x2={a.cx}
          y2={layout.endY}
        />
      ))}

      {/* 활성 구간 */}
      {layout.bars.map((b, i) => {
        const actor = layout.actors[b.actor]
        return (
          <rect
            key={i}
            className="tf-seq-activation"
            data-tone={actor.input.tone ?? 'neutral'}
            x={actor.cx - 5 + b.depth * 4}
            y={b.y0 - 4}
            width={10}
            height={Math.max(10, b.y1 - b.y0 + 12)}
            rx={2}
          />
        )
      })}

      {/* 메시지 */}
      {layout.msgs.map((m, i) => {
        const tone = m.input.tone
        const cls = cx('tf-seq-msg', tone && 'is-toned')
        const markerKey = tone ?? 'line'
        if (m.kind === 'self') {
          const c = layout.actors[m.fromIdx].cx
          const d = roundedPath(
            [
              [c + 6, m.y],
              [c + 42, m.y],
              [c + 42, m.y + 18],
              [c + 6, m.y + 18],
            ],
            6,
          )
          return (
            <g key={i} className={cls} data-tone={tone}>
              <path className="tf-edge-line" d={d} markerEnd={`url(#${uid}-arr-${markerKey})`} />
              {m.input.label && (
                <text className="tf-edge-label" x={c + 50} y={m.y + 9} textAnchor="start">
                  {m.input.label}
                </text>
              )}
            </g>
          )
        }
        const fromC = layout.actors[m.fromIdx].cx
        const toC = layout.actors[m.toIdx].cx
        const dir = Math.sign(toC - fromC)
        const x1 = fromC + dir * 6
        const x2 = toC - dir * 6
        const marker = m.kind === 'sync' ? `url(#${uid}-arr-${markerKey})` : `url(#${uid}-open-${markerKey})`
        return (
          <g key={i} className={cls} data-tone={tone} data-dashed={m.kind === 'return' ? '' : undefined}>
            <line className="tf-edge-line" x1={x1} y1={m.y} x2={x2} y2={m.y} markerEnd={marker} />
            {m.input.label && (
              <text className="tf-edge-label" x={(x1 + x2) / 2} y={m.y - 8} textAnchor="middle">
                {m.input.label}
              </text>
            )}
          </g>
        )
      })}

      {/* 액터 박스 (맨 위에) */}
      {layout.actors.map((a) => (
        <g
          key={a.input.id}
          className="tf-seq-actor"
          data-tone={a.input.tone ?? 'neutral'}
          transform={`translate(${a.cx - a.boxW / 2} ${PAD})`}
        >
          <rect width={a.boxW} height={a.boxH} rx={Math.min(metrics.radius2, a.boxH / 2)} />
          <text x={a.boxW / 2} y={a.boxH / 2} textAnchor="middle">
            {a.input.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
