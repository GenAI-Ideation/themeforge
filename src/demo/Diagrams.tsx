/**
 * 전문가 모드 쇼케이스 — 순서도 · 시퀀스 · 상태 머신.
 *
 * 다이어그램 데이터는 순수 객체이고, 시각 언어(색·모서리·선 굵기·모션)는
 * 전부 현재 테마의 토큰에서 온다. 헤더에서 테마를 바꿔보면
 * 같은 다이어그램이 다른 디자인 시스템의 다이어그램이 된다.
 */

import { useRef, useState } from 'react'
import { Button, Label, Select, Tab, TabList, TabPanel, Tabs } from '../ui'
import { downloadSvg, FlowDiagram, SequenceDiagram } from '../diagram'
import type {
  EdgeStyle,
  FlowDirection,
  FlowEdgeInput,
  FlowNodeInput,
  SequenceActorInput,
  SequenceMessageInput,
} from '../diagram'

// ---- 예제 1: 알고리즘 순서도 — JWT 로그인 ----

const LOGIN_NODES: FlowNodeInput[] = [
  { id: 'start', kind: 'terminal', label: '시작', tone: 'brand' },
  { id: 'input', kind: 'io', label: '아이디 · 비밀번호 입력' },
  { id: 'verify', kind: 'process', label: '자격 증명 검증' },
  { id: 'valid', kind: 'decision', label: '유효?' },
  { id: 'mfa', kind: 'decision', label: 'MFA 사용?' },
  { id: 'count', kind: 'process', label: '실패 횟수 +1', tone: 'warning' },
  { id: 'otp', kind: 'io', label: 'OTP 입력' },
  { id: 'locked', kind: 'decision', label: '5회 초과?', tone: 'warning' },
  { id: 'issue', kind: 'subroutine', label: 'JWT 발급', tone: 'brand', variant: 'solid' },
  { id: 'lock', kind: 'process', label: '계정 잠금', tone: 'danger', variant: 'solid' },
  { id: 'dash', kind: 'terminal', label: '대시보드', tone: 'success' },
  { id: 'end', kind: 'terminal', label: '종료', tone: 'danger' },
]

const LOGIN_EDGES: FlowEdgeInput[] = [
  { from: 'start', to: 'input' },
  { from: 'input', to: 'verify' },
  { from: 'verify', to: 'valid' },
  { from: 'valid', to: 'mfa', label: '예', tone: 'success' },
  { from: 'valid', to: 'count', label: '아니오', tone: 'danger' },
  { from: 'mfa', to: 'otp', label: '예' },
  { from: 'mfa', to: 'issue', label: '아니오' },
  { from: 'otp', to: 'issue' },
  { from: 'count', to: 'locked' },
  { from: 'locked', to: 'input', label: '재시도', dashed: true },
  { from: 'locked', to: 'lock', label: '예', tone: 'danger' },
  { from: 'issue', to: 'dash', label: '세션 시작', tone: 'brand', active: true },
  { from: 'lock', to: 'end' },
]

// ---- 예제 2: 시퀀스 다이어그램 — 결제 API ----

const PAY_ACTORS: SequenceActorInput[] = [
  { id: 'user', label: '사용자' },
  { id: 'app', label: '클라이언트', tone: 'brand' },
  { id: 'gw', label: 'API 게이트웨이', tone: 'accent' },
  { id: 'pay', label: '결제 서비스', tone: 'info' },
  { id: 'db', label: 'DB' },
]

const PAY_MESSAGES: SequenceMessageInput[] = [
  { from: 'user', to: 'app', label: '결제하기' },
  { from: 'app', to: 'gw', label: 'POST /payments' },
  { from: 'gw', to: 'gw', label: '토큰 · 서명 검증' },
  { from: 'gw', to: 'pay', label: 'authorize(주문)' },
  { from: 'pay', to: 'db', label: 'INSERT 거래' },
  { from: 'db', to: 'pay', label: 'tx_id', kind: 'return' },
  { from: 'pay', to: 'gw', label: '승인', kind: 'return', tone: 'success' },
  { from: 'gw', to: 'app', label: '201 Created', kind: 'return' },
  { from: 'app', to: 'user', label: '완료 화면', kind: 'async' },
  { from: 'pay', to: 'app', label: 'webhook: 정산 완료', kind: 'async', tone: 'success' },
]

// ---- 예제 3: 상태 머신 — 주문 라이프사이클 ----

const ORDER_NODES: FlowNodeInput[] = [
  { id: 'i', kind: 'initial' },
  { id: 'created', kind: 'state', label: '주문 생성', tone: 'brand' },
  { id: 'paid', kind: 'state', label: '결제 완료', tone: 'info' },
  { id: 'ship', kind: 'state', label: '배송 중', tone: 'accent' },
  { id: 'done', kind: 'state', label: '배송 완료', tone: 'success', variant: 'solid' },
  { id: 'cancel', kind: 'state', label: '취소됨', tone: 'danger' },
  { id: 'f', kind: 'final' },
]

const ORDER_EDGES: FlowEdgeInput[] = [
  { from: 'i', to: 'created' },
  { from: 'created', to: 'paid', label: '결제 승인' },
  { from: 'paid', to: 'ship', label: '출고' },
  { from: 'ship', to: 'ship', label: '위치 갱신' },
  { from: 'ship', to: 'done', label: '수령 확인', tone: 'success' },
  { from: 'created', to: 'cancel', label: '고객 취소', tone: 'danger', dashed: true },
  { from: 'paid', to: 'cancel', label: '환불', tone: 'danger', dashed: true },
  { from: 'done', to: 'f' },
  { from: 'cancel', to: 'f' },
]

export function DiagramsSection() {
  const [direction, setDirection] = useState<FlowDirection>('down')
  const [edgeStyle, setEdgeStyle] = useState<EdgeStyle>('smooth')
  const flowRef = useRef<SVGSVGElement | null>(null)
  const seqRef = useRef<SVGSVGElement | null>(null)
  const stateRef = useRef<SVGSVGElement | null>(null)

  const controlRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    flexWrap: 'wrap',
    marginBottom: 'var(--space-4)',
  }
  const scroller: React.CSSProperties = { overflowX: 'auto', paddingBottom: 'var(--space-2)' }

  return (
    <section className="section" id="diagrams">
      <span className="section-label">Pro Mode</span>
      <h2 className="section-title">전문가 모드 — 다이어그램도 토큰을 입는다</h2>
      <p className="section-desc">
        순서도·시퀀스·상태 머신이 컴포넌트와 <strong>같은 토큰</strong>을 소비합니다 — 노드는{' '}
        <code>data-tone × data-variant</code> 직교 좌표계, 모서리는 radius 퍼스널리티, 선 굵기는{' '}
        <code>--border-width</code>, 흐르는 간선은 모션 토큰. 위 헤더에서 테마를 바꿔보세요. 자동
        레이아웃(레이어링 + 교차 최소화)과 테마가 박제된 standalone SVG 내보내기까지.
      </p>

      <Tabs defaultValue="flow">
        <TabList aria-label="다이어그램 종류">
          <Tab value="flow">순서도</Tab>
          <Tab value="seq">시퀀스</Tab>
          <Tab value="state">상태 머신</Tab>
        </TabList>

        <TabPanel value="flow">
          <div style={controlRow}>
            <Label htmlFor="dg-dir">방향</Label>
            <Select
              id="dg-dir"
              value={direction}
              onChange={(e) => setDirection(e.target.value as FlowDirection)}
              style={{ width: 150 }}
            >
              <option value="down">위 → 아래</option>
              <option value="right">왼쪽 → 오른쪽</option>
            </Select>
            <Label htmlFor="dg-style">간선</Label>
            <Select
              id="dg-style"
              value={edgeStyle}
              onChange={(e) => setEdgeStyle(e.target.value as EdgeStyle)}
              style={{ width: 130 }}
            >
              <option value="smooth">곡선</option>
              <option value="orthogonal">직각</option>
            </Select>
            <span style={{ flex: 1 }} />
            <Button
              size="sm"
              variant="outline"
              tone="neutral"
              onClick={() => flowRef.current && downloadSvg(flowRef.current, 'login-flowchart')}
            >
              ⬇ SVG 내보내기
            </Button>
          </div>
          <div style={scroller}>
            <FlowDiagram
              ref={flowRef}
              nodes={LOGIN_NODES}
              edges={LOGIN_EDGES}
              direction={direction}
              edgeStyle={edgeStyle}
              aria-label="JWT 로그인 순서도"
            />
          </div>
        </TabPanel>

        <TabPanel value="seq">
          <div style={controlRow}>
            <p className="section-desc" style={{ margin: 0, flex: 1 }}>
              활성 구간(세로 막대)은 sync/return 호출 스택에서 자동 계산됩니다.
            </p>
            <Button
              size="sm"
              variant="outline"
              tone="neutral"
              onClick={() => seqRef.current && downloadSvg(seqRef.current, 'payment-sequence')}
            >
              ⬇ SVG 내보내기
            </Button>
          </div>
          <div style={scroller}>
            <SequenceDiagram
              ref={seqRef}
              actors={PAY_ACTORS}
              messages={PAY_MESSAGES}
              aria-label="결제 API 시퀀스 다이어그램"
            />
          </div>
        </TabPanel>

        <TabPanel value="state">
          <div style={controlRow}>
            <p className="section-desc" style={{ margin: 0, flex: 1 }}>
              같은 FlowDiagram에 <code>state / initial / final</code> 노드와 셀프 루프만 더한 것.
            </p>
            <Button
              size="sm"
              variant="outline"
              tone="neutral"
              onClick={() => stateRef.current && downloadSvg(stateRef.current, 'order-state-machine')}
            >
              ⬇ SVG 내보내기
            </Button>
          </div>
          <div style={scroller}>
            <FlowDiagram
              ref={stateRef}
              nodes={ORDER_NODES}
              edges={ORDER_EDGES}
              direction="right"
              aria-label="주문 상태 머신"
            />
          </div>
        </TabPanel>
      </Tabs>
    </section>
  )
}
