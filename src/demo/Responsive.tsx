/**
 * 반응형 쇼케이스 — 모바일 대응이 토큰·프리미티브 차원에 박혀 있음을 증명한다.
 *
 * 창을 줄여보면: 유체 타입이 줄고, Grid 열이 접히고, Stack 방향이 바뀌고,
 * 표가 카드 더미가 되고, 다이얼로그가 바텀시트가 된다. 전부 같은 코드.
 */

import { useEffect, useState } from 'react'
import { BREAKPOINTS } from '../core'
import type { Column } from '../ui'
import {
  Badge,
  Button,
  Card,
  CardBody,
  Cluster,
  DataTable,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  Grid,
  Stack,
} from '../ui'

const ORDER: Array<'base' | 'sm' | 'md' | 'lg' | 'xl'> = ['base', 'sm', 'md', 'lg', 'xl']

/** 현재 활성 브레이크포인트 — 라이브 표시용 */
function useBreakpoint() {
  const [bp, setBp] = useState<'base' | 'sm' | 'md' | 'lg' | 'xl'>('base')
  useEffect(() => {
    const mqls = (Object.entries(BREAKPOINTS) as ['sm' | 'md' | 'lg' | 'xl', number][]).map(
      ([name, w]) => ({ name, mql: matchMedia(`(min-width: ${w}px)`) }),
    )
    const update = () => {
      let cur: 'base' | 'sm' | 'md' | 'lg' | 'xl' = 'base'
      for (const { name, mql } of mqls) if (mql.matches) cur = name
      setBp(cur)
    }
    update()
    mqls.forEach(({ mql }) => mql.addEventListener('change', update))
    return () => mqls.forEach(({ mql }) => mql.removeEventListener('change', update))
  }, [])
  return bp
}

interface Invoice {
  id: string
  plan: string
  amount: string
  status: '결제됨' | '대기' | '실패'
}

const INVOICES: Invoice[] = [
  { id: 'INV-2048', plan: 'Team 연간', amount: '₩1,200,000', status: '결제됨' },
  { id: 'INV-2047', plan: 'Pro 월간', amount: '₩39,000', status: '대기' },
  { id: 'INV-2046', plan: 'Pro 월간', amount: '₩39,000', status: '실패' },
]

const STATUS_TONE = { 결제됨: 'success', 대기: 'warning', 실패: 'danger' } as const

const INVOICE_COLUMNS: Column<Invoice>[] = [
  { header: '청구서', cell: (r) => <strong>{r.id}</strong> },
  { header: '플랜', cell: (r) => r.plan },
  { header: '금액', align: 'end', cell: (r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.amount}</span> },
  {
    header: '상태',
    align: 'end',
    cell: (r) => (
      <Badge tone={STATUS_TONE[r.status]} variant="soft" dot>
        {r.status}
      </Badge>
    ),
  },
]

export function ResponsiveSection() {
  const bp = useBreakpoint()
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <section className="section" id="responsive">
      <span className="section-label">Responsive</span>
      <h2 className="section-title">모바일은 모드가 아니라 토큰의 한 차원</h2>
      <p className="section-desc">
        창 폭을 줄여보세요. 유체 타입이 줄고, 그리드가 접히고, 스택 방향이 바뀌고, 표가 카드가 되고,
        다이얼로그가 바텀시트로 바뀝니다 — 전부 같은 코드, 미디어 쿼리 JS 0개. 터치에서는 모든 컨트롤이
        최소 44px 탭 타깃을 보장받고, 입력은 16px로 떠서 iOS 줌도 막습니다.
      </p>

      <Cluster gap={2}>
        <Badge variant="soft" tone="brand">
          현재 브레이크포인트: <strong style={{ marginLeft: 4 }}>{bp}</strong>
        </Badge>
        {ORDER.map((b) => (
          <Badge key={b} variant={b === bp ? 'solid' : 'outline'} tone={b === bp ? 'brand' : 'neutral'}>
            {b}
          </Badge>
        ))}
      </Cluster>

      {/* Grid — 반응형 열 */}
      <Stack gap={3}>
        <code className="tf-hint">{`<Grid cols={{ base: 1, sm: 2, lg: 4 }}>`}</code>
        <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap={4}>
          {['수집', '정규화', '분석', '배포'].map((step, i) => (
            <Card key={step}>
              <CardBody className="stack" style={{ gap: 'var(--space-1)' }}>
                <span className="tf-hint">단계 {i + 1}</span>
                <strong style={{ fontSize: 'var(--text-lg)' }}>{step}</strong>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </Stack>

      {/* Stack — 방향 전환 */}
      <Stack gap={3}>
        <code className="tf-hint">{`<Stack direction={{ base: 'column', md: 'row' }}>`}</code>
        <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
          <Card style={{ flex: 1 }}>
            <CardBody>
              <strong>모바일에선 세로로 쌓이고</strong>
              <p className="tf-hint" style={{ marginTop: 'var(--space-1)' }}>
                좁은 화면에서는 한 줄에 하나씩.
              </p>
            </CardBody>
          </Card>
          <Card style={{ flex: 1 }}>
            <CardBody>
              <strong>md부터 가로로 나란히</strong>
              <p className="tf-hint" style={{ marginTop: 'var(--space-1)' }}>
                768px 이상에서 옆으로 붙습니다.
              </p>
            </CardBody>
          </Card>
        </Stack>
      </Stack>

      {/* DataTable — 모바일 카드 스택 + 바텀시트 */}
      <Stack gap={3}>
        <code className="tf-hint">{`<DataTable stackOnMobile />  ·  <Dialog placement="auto">`}</code>
        <DataTable columns={INVOICE_COLUMNS} rows={INVOICES} rowKey={(r) => r.id} stackOnMobile />
        <Cluster>
          <Button onClick={() => setSheetOpen(true)}>바텀시트 열기</Button>
          <span className="tf-hint">모바일에선 아래에서 올라오고, 데스크톱에선 중앙 모달.</span>
        </Cluster>
      </Stack>

      <Dialog open={sheetOpen} onClose={() => setSheetOpen(false)} placement="auto">
        <DialogTitle>결제 수단 변경</DialogTitle>
        <DialogDescription>
          좁은 화면에서는 바텀시트(하단에서 슬라이드, safe-area 보정, 그랩 핸들)로, 넓은 화면에서는 중앙
          모달로 나타납니다 — <code>placement="auto"</code> 하나로.
        </DialogDescription>
        <DialogFooter>
          <Button variant="ghost" tone="neutral" onClick={() => setSheetOpen(false)}>
            취소
          </Button>
          <Button onClick={() => setSheetOpen(false)}>저장</Button>
        </DialogFooter>
      </Dialog>
    </section>
  )
}
