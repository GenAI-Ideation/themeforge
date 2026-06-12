/**
 * 순서도 자동 레이아웃 — 계층형(Sugiyama-lite) 알고리즘. 의존성 0.
 *
 * 1) DFS로 역방향(back) 간선 검출 — 루프는 옆 레인으로 우회
 * 2) 전방 간선만으로 위상 정렬 + 최장 경로 레이어링
 * 3) barycenter 휴리스틱(3패스)으로 레이어 내 교차 최소화
 * 4) 좌표 배치 (cross/main 축 추상화 → down/right 방향 공짜)
 * 5) 간선 라우팅: 곡선/직각, 루프백 레인, 셀프 루프, 분기 부채꼴
 *
 * 노드 수십 개 규모를 위한 휴리스틱이다. 수백 노드급 그래프는
 * ELK/dagre 같은 전용 엔진을 어댑터로 물리는 것을 권한다.
 */

import { measureLines } from './measure'
import type { DiagramMetrics, MeasuredText } from './measure'
import type { Tone, Variant } from '../ui/shared'

export type FlowDirection = 'down' | 'right'
export type EdgeStyle = 'smooth' | 'orthogonal'

export type FlowNodeKind =
  | 'process'
  | 'decision'
  | 'terminal'
  | 'io'
  | 'subroutine'
  | 'state'
  | 'initial'
  | 'final'

export interface FlowNodeInput {
  id: string
  label?: string
  /** 순서도 의미론: process(처리) decision(분기) terminal(시작/끝) io(입출력) subroutine(서브루틴) state(상태) initial/final(상태머신 시작·끝) */
  kind?: FlowNodeKind
  tone?: Tone
  variant?: Extract<Variant, 'soft' | 'solid' | 'outline'> | (string & {})
}

export interface FlowEdgeInput {
  from: string
  to: string
  label?: string
  tone?: Tone
  dashed?: boolean
  /** 흐르는 점선 애니메이션(모션 토큰 --dur-3 비례) — 핵심 경로 강조용 */
  active?: boolean
}

export interface PlacedNode {
  id: string
  kind: FlowNodeKind
  tone?: Tone
  variant: string
  x: number
  y: number
  w: number
  h: number
  label: MeasuredText
}

export interface PlacedEdge {
  key: string
  tone?: Tone
  dashed?: boolean
  active?: boolean
  path: string
  label?: string
  labelX: number
  labelY: number
  labelAnchor: 'start' | 'middle'
}

export interface FlowLayout {
  width: number
  height: number
  nodes: PlacedNode[]
  edges: PlacedEdge[]
}

export interface FlowLayoutOptions {
  direction?: FlowDirection
  edgeStyle?: EdgeStyle
  metrics: DiagramMetrics
}

const PAD = 16

const fmt = (n: number) => Math.round(n * 10) / 10

/** 꺾인 폴리라인을 모서리 둥근 path 로 — 직각 라우팅과 루프백 레인에 사용 */
export function roundedPath(points: Array<[number, number]>, r: number): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${fmt(points[0][0])} ${fmt(points[0][1])}`
  let d = `M ${fmt(points[0][0])} ${fmt(points[0][1])}`
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1]
    const [cx, cy] = points[i]
    const [nx, ny] = points[i + 1]
    const inLen = Math.hypot(cx - px, cy - py)
    const outLen = Math.hypot(nx - cx, ny - cy)
    const ri = Math.min(r, inLen / 2, outLen / 2)
    if (ri < 0.5 || inLen < 0.01 || outLen < 0.01) {
      d += ` L ${fmt(cx)} ${fmt(cy)}`
      continue
    }
    const ix = cx - ((cx - px) / inLen) * ri
    const iy = cy - ((cy - py) / inLen) * ri
    const ox = cx + ((nx - cx) / outLen) * ri
    const oy = cy + ((ny - cy) / outLen) * ri
    d += ` L ${fmt(ix)} ${fmt(iy)} Q ${fmt(cx)} ${fmt(cy)} ${fmt(ox)} ${fmt(oy)}`
  }
  const last = points[points.length - 1]
  d += ` L ${fmt(last[0])} ${fmt(last[1])}`
  return d
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

interface SizedNode {
  input: FlowNodeInput
  kind: FlowNodeKind
  w: number
  h: number
  label: MeasuredText
  layer: number
  mainPos: number
  crossCenter: number
}

interface InternalEdge {
  input: FlowEdgeInput
  index: number
  from: number
  to: number
  self: boolean
  back: boolean
}

function sizeNode(kind: FlowNodeKind, labelText: string, font: string): { w: number; h: number; label: MeasuredText } {
  const label = measureLines(labelText, font)
  const tw = label.w
  const th = Math.max(label.h, label.lineHeight)
  switch (kind) {
    case 'decision':
      return { w: Math.max(88, tw * 1.55 + 26), h: Math.max(56, th + 36), label }
    case 'io': {
      const h = Math.max(40, th + 20)
      const skew = Math.round(h * 0.32)
      return { w: Math.max(96, tw + 30 + skew * 2), h, label }
    }
    case 'subroutine':
      return { w: Math.max(100, tw + 58), h: Math.max(40, th + 20), label }
    case 'terminal':
      return { w: Math.max(84, tw + 44), h: Math.max(40, th + 20), label }
    case 'initial':
      return { w: 16, h: 16, label }
    case 'final':
      return { w: 22, h: 22, label }
    default: // process · state
      return { w: Math.max(84, tw + 34), h: Math.max(40, th + 20), label }
  }
}

export function layoutFlow(
  nodesIn: FlowNodeInput[],
  edgesIn: FlowEdgeInput[],
  opts: FlowLayoutOptions,
): FlowLayout {
  const { metrics } = opts
  const direction = opts.direction ?? 'down'
  const edgeStyle = opts.edgeStyle ?? 'smooth'
  const down = direction === 'down'
  if (nodesIn.length === 0) return { width: 0, height: 0, nodes: [], edges: [] }

  const nodeFont = `500 13px ${metrics.fontBody}`
  const labelFont = `12px ${metrics.fontBody}`
  const gapMain = Math.max(40, metrics.unit * 12)
  const gapCross = Math.max(26, metrics.unit * 8)

  // ---- 1. 노드 측정
  const nodes: SizedNode[] = nodesIn.map((input) => {
    const kind = input.kind ?? 'process'
    const { w, h, label } = sizeNode(kind, input.label ?? '', nodeFont)
    return { input, kind, w, h, label, layer: 0, mainPos: 0, crossCenter: 0 }
  })
  // main = 흐름 축, cross = 수직 축
  const mainSize = (i: number) => (down ? nodes[i].h : nodes[i].w)
  const crossSize = (i: number) => (down ? nodes[i].w : nodes[i].h)

  const index = new Map(nodes.map((n, i) => [n.input.id, i]))
  const edges: InternalEdge[] = []
  edgesIn.forEach((input, i) => {
    const from = index.get(input.from)
    const to = index.get(input.to)
    if (from == null || to == null) {
      console.warn(`[FlowDiagram] 알 수 없는 노드를 잇는 간선 무시: ${input.from} → ${input.to}`)
      return
    }
    edges.push({ input, index: i, from, to, self: from === to, back: false })
  })

  // ---- 2. 역방향 간선 검출 (DFS, 재귀 스택 위의 노드로 가면 back)
  {
    const adj: number[][] = nodes.map(() => [])
    edges.forEach((e, ei) => {
      if (!e.self) adj[e.from].push(ei)
    })
    const state = new Array<number>(nodes.length).fill(0)
    const visit = (u: number) => {
      state[u] = 1
      for (const ei of adj[u]) {
        const v = edges[ei].to
        if (state[v] === 1) edges[ei].back = true
        else if (state[v] === 0) visit(v)
      }
      state[u] = 2
    }
    nodes.forEach((_, i) => {
      if (state[i] === 0) visit(i)
    })
  }

  const forward = edges.filter((e) => !e.self && !e.back)

  // 셀프 루프는 cross+ 쪽으로 혹(bump)이 튀어나온다 — 그 노드 다음에 여유 공간 확보
  const selfExtra = new Array<number>(nodes.length).fill(0)
  edges.forEach((e) => {
    if (!e.self) return
    const lbl = e.input.label ? measureLines(e.input.label, labelFont) : null
    const extra = 36 + (lbl ? (down ? lbl.w + 12 : lbl.lineHeight + 10) : 0)
    selfExtra[e.from] = Math.max(selfExtra[e.from], extra)
  })

  // ---- 3. 레이어링: Kahn 위상 정렬 + 최장 경로
  const topo: number[] = []
  {
    const fadj: number[][] = nodes.map(() => [])
    const indeg = new Array<number>(nodes.length).fill(0)
    forward.forEach((e) => {
      fadj[e.from].push(e.to)
      indeg[e.to]++
    })
    const queue = nodes.map((_, i) => i).filter((i) => indeg[i] === 0)
    while (queue.length) {
      const u = queue.shift()!
      topo.push(u)
      for (const v of fadj[u]) {
        nodes[v].layer = Math.max(nodes[v].layer, nodes[u].layer + 1)
        if (--indeg[v] === 0) queue.push(v)
      }
    }
  }

  const maxLayer = Math.max(...nodes.map((n) => n.layer))
  const layers: number[][] = Array.from({ length: maxLayer + 1 }, () => [])
  topo.forEach((i) => layers[nodes[i].layer].push(i))

  // ---- 4. barycenter 교차 최소화
  {
    const preds: number[][] = nodes.map(() => [])
    const succs: number[][] = nodes.map(() => [])
    forward.forEach((e) => {
      preds[e.to].push(e.from)
      succs[e.from].push(e.to)
    })
    const pos = new Array<number>(nodes.length).fill(0)
    const setPos = () => layers.forEach((L) => L.forEach((n, i) => (pos[n] = i)))
    setPos()
    const sortLayer = (L: number[], ref: number[][]) => {
      const scored = L.map((n, i) => {
        const ns = ref[n]
        const b = ns.length ? ns.reduce((s, v) => s + pos[v], 0) / ns.length : pos[n]
        return { n, b, i }
      })
      scored.sort((a, b) => a.b - b.b || a.i - b.i)
      return scored.map((s) => s.n)
    }
    for (let it = 0; it < 3; it++) {
      for (let li = 1; li <= maxLayer; li++) {
        layers[li] = sortLayer(layers[li], preds)
        setPos()
      }
      for (let li = maxLayer - 1; li >= 0; li--) {
        layers[li] = sortLayer(layers[li], succs)
        setPos()
      }
    }
  }

  // ---- 5. 좌표: cross(레이어 내) — 레이어별 중앙 정렬
  const layerCross = layers.map(
    (L) => L.reduce((s, n) => s + crossSize(n) + selfExtra[n], 0) + gapCross * Math.max(0, L.length - 1),
  )
  const maxCrossSpan = Math.max(...layerCross)
  layers.forEach((L, li) => {
    let c = PAD + (maxCrossSpan - layerCross[li]) / 2
    for (const n of L) {
      nodes[n].crossCenter = c + crossSize(n) / 2
      c += crossSize(n) + selfExtra[n] + gapCross
    }
  })

  // ---- 6. 좌표: main(레이어 순서)
  let cursor = PAD
  layers.forEach((L) => {
    const span = Math.max(...L.map((n) => mainSize(n)))
    for (const n of L) nodes[n].mainPos = cursor + (span - mainSize(n)) / 2
    cursor += span + gapMain
  })
  const mainExtent = cursor - gapMain + PAD

  // ---- 7. 간선 라우팅
  const pt = (cross: number, main: number): [number, number] => (down ? [cross, main] : [main, cross])
  const mainStart = (i: number) => nodes[i].mainPos
  const mainEnd = (i: number) => nodes[i].mainPos + mainSize(i)
  const mainCenter = (i: number) => nodes[i].mainPos + mainSize(i) / 2
  const crossCenter = (i: number) => nodes[i].crossCenter
  const crossEnd = (i: number) => nodes[i].crossCenter + crossSize(i) / 2

  // 분기/합류 부채꼴: 같은 노드에서 나가는(들어오는) 전방 간선들의 포트를 살짝 벌린다.
  // decision/io/initial/final 은 꼭짓점·기하가 좁아 중앙 포트 고정.
  const fanned = (kind: FlowNodeKind) =>
    kind === 'process' || kind === 'state' || kind === 'terminal' || kind === 'subroutine'
  const outOffset = new Map<number, number>()
  const inOffset = new Map<number, number>()
  {
    const outBy = new Map<number, number[]>()
    const inBy = new Map<number, number[]>()
    edges.forEach((e, ei) => {
      if (e.self || e.back) return
      ;(outBy.get(e.from) ?? outBy.set(e.from, []).get(e.from)!).push(ei)
      ;(inBy.get(e.to) ?? inBy.set(e.to, []).get(e.to)!).push(ei)
    })
    const assign = (
      by: Map<number, number[]>,
      offsets: Map<number, number>,
      other: (e: InternalEdge) => number,
    ) => {
      for (const [n, list] of by) {
        if (!fanned(nodes[n].kind) || list.length < 2) continue
        const sorted = [...list].sort((a, b) => crossCenter(other(edges[a])) - crossCenter(other(edges[b])))
        const spread = Math.min(18, crossSize(n) / (sorted.length + 1))
        sorted.forEach((ei, i) => offsets.set(ei, (i - (sorted.length - 1) / 2) * spread))
      }
    }
    assign(outBy, outOffset, (e) => e.to)
    assign(inBy, inOffset, (e) => e.from)
  }

  let crossMax = PAD + maxCrossSpan
  let backLane = PAD + maxCrossSpan + gapCross * 0.9
  const layoutCenter = PAD + maxCrossSpan / 2

  const placedEdges: PlacedEdge[] = edges.map((e, ei) => {
    const lbl = e.input.label ? measureLines(e.input.label, labelFont) : null
    let path = ''
    let labelX = 0
    let labelY = 0
    let labelAnchor: 'start' | 'middle' = 'middle'

    if (e.self) {
      // 셀프 루프: cross+ 쪽으로 작은 혹
      const cEnd = crossEnd(e.from)
      const mc = mainCenter(e.from)
      const bump = 30
      const a = pt(cEnd, mc - 9)
      const c1 = pt(cEnd + bump, mc - 17)
      const c2 = pt(cEnd + bump, mc + 17)
      const b = pt(cEnd, mc + 9)
      path = `M ${fmt(a[0])} ${fmt(a[1])} C ${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(b[0])} ${fmt(b[1])}`
      const lp = pt(cEnd + bump + (down ? 8 : 14), mc)
      labelX = lp[0]
      labelY = lp[1]
      labelAnchor = down ? 'start' : 'middle'
      crossMax = Math.max(crossMax, cEnd + bump + (lbl && down ? lbl.w + 14 : 16))
    } else if (e.back) {
      // 루프백: 바깥 레인으로 우회 (cross+ 측)
      const lane = backLane
      backLane += 20
      const sM = mainCenter(e.from)
      const tM = mainCenter(e.to)
      path = roundedPath(
        [pt(crossEnd(e.from), sM), pt(lane, sM), pt(lane, tM), pt(crossEnd(e.to), tM)],
        10,
      )
      const lp = pt(lane + (down ? 8 : 14), (sM + tM) / 2)
      labelX = lp[0]
      labelY = lp[1]
      labelAnchor = down ? 'start' : 'middle'
      crossMax = Math.max(crossMax, lane + (lbl && down ? lbl.w + 14 : 16))
    } else {
      const sC = crossCenter(e.from) + (outOffset.get(ei) ?? 0)
      const tC = crossCenter(e.to) + (inOffset.get(ei) ?? 0)
      const sM = mainEnd(e.from)
      const tM = mainStart(e.to)
      const span = nodes[e.to].layer - nodes[e.from].layer

      if (edgeStyle === 'orthogonal') {
        if (span > 1) {
          // 레이어 건너뛰기: 중간 레이어의 노드를 피해 대상 열 오른쪽(cross+) 레인으로
          const laneC = tC + crossSize(e.to) / 2 + gapCross * 0.55
          path = roundedPath(
            [
              pt(sC, sM),
              pt(sC, sM + gapMain / 2),
              pt(laneC, sM + gapMain / 2),
              pt(laneC, tM - gapMain / 2),
              pt(tC, tM - gapMain / 2),
              pt(tC, tM),
            ],
            9,
          )
          const lp = pt(laneC + (down ? 7 : 13), (sM + tM) / 2)
          labelX = lp[0]
          labelY = lp[1]
          labelAnchor = down ? 'start' : 'middle'
          crossMax = Math.max(crossMax, laneC + (lbl && down ? lbl.w + 14 : 12))
        } else if (Math.abs(sC - tC) < 1) {
          path = `M ${fmt(pt(sC, sM)[0])} ${fmt(pt(sC, sM)[1])} L ${fmt(pt(tC, tM)[0])} ${fmt(pt(tC, tM)[1])}`
          const lp = pt(sC, (sM + tM) / 2)
          labelX = lp[0]
          labelY = lp[1]
        } else {
          const midM = (sM + tM) / 2
          path = roundedPath([pt(sC, sM), pt(sC, midM), pt(tC, midM), pt(tC, tM)], 9)
          const lp = pt((sC + tC) / 2, midM)
          labelX = lp[0]
          labelY = lp[1]
        }
      } else {
        // 곡선: 흐름 축으로 당기는 베지어. 레이어를 건너뛰면 바깥쪽으로 활처럼 휜다.
        const k = Math.max(24, (tM - sM) * 0.42)
        let bow = span > 1 ? ((sC + tC) / 2 >= layoutCenter ? 1 : -1) * Math.min(56, 30 * (span - 1)) : 0
        // 캔버스 밖으로 휘지 않게 클램프
        if (bow < 0) bow = Math.max(bow, -(Math.min(sC, tC) - 14))
        if (bow > 0) crossMax = Math.max(crossMax, Math.max(sC, tC) + bow * 0.8 + 10)
        const p0 = pt(sC, sM)
        const p1 = pt(sC + bow, sM + k)
        const p2 = pt(tC + bow, tM - k)
        const p3 = pt(tC, tM)
        path = `M ${fmt(p0[0])} ${fmt(p0[1])} C ${fmt(p1[0])} ${fmt(p1[1])} ${fmt(p2[0])} ${fmt(p2[1])} ${fmt(p3[0])} ${fmt(p3[1])}`
        // 분기(decision) 라벨은 출발점 근처가 읽기 좋다
        const t = nodes[e.from].kind === 'decision' ? 0.28 : 0.5
        labelX = cubicAt(p0[0], p1[0], p2[0], p3[0], t)
        labelY = cubicAt(p0[1], p1[1], p2[1], p3[1], t)
      }
    }

    return {
      key: `${e.input.from}->${e.input.to}#${e.index}`,
      tone: e.input.tone,
      dashed: e.input.dashed,
      active: e.input.active,
      path,
      label: e.input.label,
      labelX: fmt(labelX),
      labelY: fmt(labelY),
      labelAnchor,
    }
  })

  // ---- 8. 화면 좌표로 변환
  const placedNodes: PlacedNode[] = nodes.map((n) => {
    const cc = n.crossCenter
    const mp = n.mainPos
    return {
      id: n.input.id,
      kind: n.kind,
      tone: n.input.tone,
      variant: n.input.variant ?? 'soft',
      x: fmt(down ? cc - n.w / 2 : mp),
      y: fmt(down ? mp : cc - n.h / 2),
      w: n.w,
      h: n.h,
      label: n.label,
    }
  })

  const crossExtent = crossMax + PAD
  return {
    width: Math.ceil(down ? crossExtent : mainExtent),
    height: Math.ceil(down ? mainExtent : crossExtent),
    nodes: placedNodes,
    edges: placedEdges,
  }
}
