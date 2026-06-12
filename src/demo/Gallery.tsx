/**
 * 컴포넌트 갤러리 — 활성 테마가 시스템 전체를 어떻게 리스킨하는지 보여준다.
 * 모든 섹션은 토큰/컴포넌트만 사용한다 (하드코딩 색 없음).
 */

import { Fragment, useState } from 'react'
import type { BuiltTheme, Mode, ToneName } from '../core'
import { auditScale, formatOklch, TONES } from '../core'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  Field,
  Input,
  Kbd,
  Progress,
  Radio,
  Select,
  Separator,
  Skeleton,
  Spinner,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Table,
  Tabs,
  TBody,
  Textarea,
  THead,
  Tooltip,
} from '../ui'
import type { Variant } from '../ui'

interface SectionProps {
  id: string
  label: string
  title: string
  desc?: string
  children: React.ReactNode
}

function Section({ id, label, title, desc, children }: SectionProps) {
  return (
    <section className="section" id={id}>
      <span className="section-label">{label}</span>
      <h2 className="section-title">{title}</h2>
      {desc && <p className="section-desc">{desc}</p>}
      {children}
    </section>
  )
}

// ---------- 색상 ----------

function ColorsSection({ theme, mode }: { theme: BuiltTheme; mode: Mode }) {
  const palette = theme[mode]
  const auditGray = auditScale(palette.scales.neutral)
  const auditBrand = auditScale(palette.scales.brand)

  return (
    <Section
      id="colors"
      label="Tokens / Color"
      title="시드 하나 → 84색 팔레트"
      desc="브랜드 색 1개에서 OKLCH 명도 곡선을 따라 7개 톤 × 12스텝이 자동 전개됩니다. 1-2 배경 · 3-5 컴포넌트 · 6-8 경계선 · 9-10 솔리드 · 11-12 텍스트."
    >
      <div className="swatch-grid">
        <div className="swatch-steps" aria-hidden>
          <span />
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        {TONES.map((tone: ToneName) => (
          <div className="swatch-row" key={tone}>
            <span className="swatch-row-label">{tone === 'neutral' ? 'gray' : tone}</span>
            {palette.scales[tone].steps.map((step, i) => (
              <div
                key={i}
                className="swatch"
                style={{ background: formatOklch(step) }}
                title={`${tone}-${i + 1}: ${formatOklch(step)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="audit-chips">
        <Badge tone={auditGray.textHigh >= 7 ? 'success' : 'warning'} variant="soft" dot>
          본문 텍스트 대비 {auditGray.textHigh.toFixed(1)}:1
        </Badge>
        <Badge tone={auditGray.text >= 4.5 ? 'success' : 'warning'} variant="soft" dot>
          보조 텍스트 대비 {auditGray.text.toFixed(1)}:1
        </Badge>
        <Badge tone={auditBrand.onSolid >= 4.5 ? 'success' : 'warning'} variant="soft" dot>
          솔리드 버튼 텍스트 {auditBrand.onSolid.toFixed(1)}:1
        </Badge>
        <span className="tf-hint">— WCAG 기준, 스케일 생성기가 자동 보정</span>
      </div>
    </Section>
  )
}

// ---------- 타이포그래피 ----------

const TYPE_SAMPLES: Array<['4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs', string]> = [
  ['4xl', '디자인은 시스템이다'],
  ['3xl', '디자인은 시스템이다'],
  ['2xl', 'Design is a system'],
  ['xl', '토큰이 결정하고 컴포넌트가 따른다'],
  ['lg', '토큰이 결정하고 컴포넌트가 따른다'],
  ['md', '본문 텍스트 — 16px 기준, 비율로 전개. The quick brown fox jumps over the lazy dog.'],
  ['sm', '보조 설명 텍스트 — supporting copy 0123456789'],
  ['xs', '캡션 · 레이블 · 메타데이터'],
]

function TypeSection() {
  return (
    <Section
      id="type"
      label="Tokens / Typography"
      title="모듈러 타입 스케일"
      desc="기준 16px에 공비(테마 랩의 '타입 스케일 비율')를 거듭제곱해 8단계를 만듭니다. 제목 폰트·자간·행간은 퍼스널리티가 결정합니다."
    >
      <div className="type-sample">
        {TYPE_SAMPLES.map(([size, text]) => (
          <div key={size}>
            <span className="type-meta">--text-{size}</span>
            <span
              style={{
                fontSize: `var(--text-${size})`,
                fontFamily: size === 'md' || size === 'sm' || size === 'xs' ? 'var(--font-body)' : 'var(--font-heading)',
                fontWeight: size === 'md' || size === 'sm' || size === 'xs' ? 400 : 650,
                lineHeight: 1.25,
                letterSpacing: size === 'md' || size === 'sm' || size === 'xs' ? 0 : 'var(--tracking-heading)',
              }}
            >
              {text}
            </span>
          </div>
        ))}
        <div>
          <span className="type-meta">--font-mono</span>
          <code>const theme = buildTheme(seed) // 0O 1lI</code>
        </div>
      </div>
    </Section>
  )
}

// ---------- 버튼 ----------

const VARIANTS: Variant[] = ['solid', 'soft', 'outline', 'ghost']

function ButtonsSection() {
  return (
    <Section
      id="buttons"
      label="Components / Button"
      title="변형 × 톤 = 직교 매트릭스"
      desc="변형(모양)과 톤(의미 색)은 독립 파라미터입니다. 새 톤을 추가하면 모든 변형에서, 새 변형을 추가하면 모든 톤에서 즉시 동작합니다."
    >
      <div className="matrix">
        <span />
        {TONES.map((t) => (
          <span className="matrix-label" key={t}>
            {t}
          </span>
        ))}
        {VARIANTS.map((variant) => (
          <Fragment key={variant}>
            <span className="matrix-label">{variant}</span>
            {TONES.map((tone) => (
              <Button key={tone} variant={variant} tone={tone} size="sm">
                버튼
              </Button>
            ))}
          </Fragment>
        ))}
      </div>
      <div className="row">
        <Button size="lg">크게</Button>
        <Button>보통</Button>
        <Button size="sm">작게</Button>
        <Separator orientation="vertical" />
        <Button loading>저장 중</Button>
        <Button disabled>비활성</Button>
        <Button iconOnly aria-label="설정" variant="soft" tone="neutral">
          ⚙
        </Button>
        <Tooltip content="asChild — 링크가 버튼 옷을 입는다">
          <Button asChild variant="outline" tone="accent">
            <a href="#colors">앵커 링크 버튼</a>
          </Button>
        </Tooltip>
      </div>
    </Section>
  )
}

// ---------- 폼 ----------

function FormSection() {
  const [plan, setPlan] = useState('pro')
  return (
    <Section
      id="form"
      label="Components / Form"
      title="폼 컨트롤"
      desc="네이티브 input 위에 토큰으로만 그렸습니다 — 포커스 링, 에러 상태, 비활성까지 테마가 결정합니다."
    >
      <div className="grid-cards">
        <Card>
          <CardHeader>
            <CardTitle>프로젝트 만들기</CardTitle>
            <CardDescription>토큰이 입힌 폼 — 테마를 바꿔 보세요.</CardDescription>
          </CardHeader>
          <CardBody className="stack">
            <Field label="프로젝트 이름" hint="소문자와 하이픈만 사용">
              {(id) => <Input id={id} placeholder="my-design-system" />}
            </Field>
            <Field label="이메일" error="회사 이메일이 아닙니다">
              {(id) => <Input id={id} type="email" defaultValue="hello@gmail.com" invalid />}
            </Field>
            <Field label="팀">
              {(id) => (
                <Select id={id} defaultValue="design">
                  <option value="design">디자인</option>
                  <option value="eng">엔지니어링</option>
                  <option value="growth">그로스</option>
                </Select>
              )}
            </Field>
            <Field label="설명 (soft 변형)">
              {(id) => <Textarea id={id} variant="soft" placeholder="이 시스템은 어떤 제품을 위한 것인가요?" />}
            </Field>
          </CardBody>
          <CardFooter>
            <Button>만들기</Button>
            <Button variant="ghost" tone="neutral">
              취소
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>선택 컨트롤</CardTitle>
            <CardDescription>checkbox · radio · switch</CardDescription>
          </CardHeader>
          <CardBody className="stack">
            <Checkbox defaultChecked label="이용약관에 동의합니다" />
            <Checkbox label="뉴스레터 구독 (선택)" />
            <Checkbox disabled label="비활성 옵션" />
            <Separator />
            <div className="stack" role="radiogroup" aria-label="플랜">
              {[
                ['starter', '스타터 — 무료'],
                ['pro', '프로 — ₩12,000/월'],
                ['enterprise', '엔터프라이즈 — 문의'],
              ].map(([value, label]) => (
                <Radio
                  key={value}
                  name="plan"
                  value={value}
                  checked={plan === value}
                  onChange={() => setPlan(value)}
                  label={label}
                />
              ))}
            </div>
            <Separator />
            <Switch defaultChecked label="제품 업데이트 알림" />
            <Switch label="마케팅 수신 동의" tone="accent" />
          </CardBody>
        </Card>
      </div>
    </Section>
  )
}

// ---------- 피드백 ----------

function FeedbackSection() {
  const [progress, setProgress] = useState(64)
  return (
    <Section
      id="feedback"
      label="Components / Feedback"
      title="피드백 & 상태"
      desc="상태색도 시드에서 유도됩니다 — 브랜드 색상각 쪽으로 살짝 끌려와(hue harmonization) 팔레트가 한 가족처럼 보입니다."
    >
      <div className="stack">
        <Alert tone="info" title="새 버전이 있습니다">
          토큰 v2가 출시되었습니다. 마이그레이션 가이드를 확인하세요.
        </Alert>
        <Alert tone="success" title="배포 완료">
          production에 v1.4.2가 반영되었습니다.
        </Alert>
        <Alert tone="warning" variant="outline" title="사용량 경고">
          이번 달 빌드 시간의 85%를 사용했습니다.
        </Alert>
        <Alert tone="danger" variant="solid" title="결제 실패">
          카드가 거절되었습니다. 결제 수단을 업데이트하세요.
        </Alert>
      </div>

      <div className="row">
        {(['solid', 'soft', 'outline'] as const).map((v) => (
          <Badge key={v} variant={v} tone="brand">
            {v}
          </Badge>
        ))}
        <Badge tone="success" dot>
          가동 중
        </Badge>
        <Badge tone="warning" dot>
          점검 예정
        </Badge>
        <Badge tone="danger" variant="outline">
          중단됨
        </Badge>
        <Badge tone="accent">NEW</Badge>
      </div>

      <div className="grid-cards">
        <Card>
          <CardBody className="stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>스토리지 사용량</span>
              <span className="tf-hint">{progress}%</span>
            </div>
            <Progress value={progress} />
            <div className="row">
              <Button size="sm" variant="soft" onClick={() => setProgress(Math.max(0, progress - 12))}>
                −12%
              </Button>
              <Button size="sm" variant="soft" onClick={() => setProgress(Math.min(100, progress + 12))}>
                +12%
              </Button>
              <Spinner style={{ color: 'var(--brand-9)' }} />
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="stack" aria-label="로딩 스켈레톤">
            <div className="row">
              <Skeleton width={40} height={40} style={{ borderRadius: 'var(--radius-full)' }} />
              <div className="stack" style={{ flex: 1, gap: 'var(--space-2)' }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="38%" height={12} />
              </div>
            </div>
            <Skeleton height={12} />
            <Skeleton height={12} width="84%" />
          </CardBody>
        </Card>
      </div>
    </Section>
  )
}

// ---------- 데이터 ----------

const MEMBERS = [
  { name: '김하늘', role: '프로덕트 디자이너', status: 'active', usage: 92 },
  { name: '이도윤', role: '프론트엔드 엔지니어', status: 'active', usage: 78 },
  { name: 'Sofia Park', role: '브랜드 디자이너', status: 'away', usage: 41 },
  { name: '최서준', role: '데이터 분석가', status: 'offline', usage: 12 },
] as const

const STATUS_TONE = { active: 'success', away: 'warning', offline: 'neutral' } as const
const STATUS_LABEL = { active: '활성', away: '자리 비움', offline: '오프라인' } as const

function DataSection() {
  return (
    <Section
      id="data"
      label="Components / Data"
      title="데이터 표현"
      desc="통계 카드, 테이블, 탭 — 대시보드를 구성하는 조각들."
    >
      <div className="grid-cards">
        {[
          { label: '월간 활성 사용자', value: '12,481', delta: '+12.4%', tone: 'success' as const },
          { label: '전환율', value: '3.92%', delta: '−0.8%', tone: 'danger' as const },
          { label: 'MRR', value: '₩42.1M', delta: '+4.2%', tone: 'success' as const },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardBody className="stack" style={{ gap: 'var(--space-2)' }}>
              <span className="tf-hint">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
              <span className="stat-delta" style={{ color: `var(--${stat.tone}-11)` }}>
                {stat.delta} <span className="tf-hint">지난 30일</span>
              </span>
            </CardBody>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="members">
        <TabList>
          <Tab value="members">팀원</Tab>
          <Tab value="usage">사용량</Tab>
          <Tab value="settings">설정</Tab>
        </TabList>
        <TabPanel value="members">
          <Table>
            <THead>
              <tr>
                <th>이름</th>
                <th>역할</th>
                <th>상태</th>
                <th style={{ width: 160 }}>시트 사용률</th>
              </tr>
            </THead>
            <TBody>
              {MEMBERS.map((m) => (
                <tr key={m.name}>
                  <td>
                    <span className="row" style={{ flexWrap: 'nowrap' }}>
                      <Avatar name={m.name} size="sm" tone={STATUS_TONE[m.status]} />
                      <strong>{m.name}</strong>
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{m.role}</td>
                  <td>
                    <Badge tone={STATUS_TONE[m.status]} dot>
                      {STATUS_LABEL[m.status]}
                    </Badge>
                  </td>
                  <td>
                    <Progress value={m.usage} tone={m.usage > 85 ? 'warning' : 'brand'} />
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        </TabPanel>
        <TabPanel value="usage">
          <Alert tone="info">사용량 데이터는 매시간 갱신됩니다.</Alert>
        </TabPanel>
        <TabPanel value="settings">
          <div className="stack">
            <Switch defaultChecked label="멤버 초대 허용" />
            <Switch label="외부 공유 잠금" />
          </div>
        </TabPanel>
      </Tabs>

      <Tabs defaultValue="day">
        <TabList variant="pills" aria-label="기간">
          <Tab value="day">일간</Tab>
          <Tab value="week">주간</Tab>
          <Tab value="month">월간</Tab>
        </TabList>
      </Tabs>
    </Section>
  )
}

// ---------- 오버레이 ----------

function OverlaySection() {
  const [open, setOpen] = useState(false)
  return (
    <Section
      id="overlay"
      label="Components / Overlay"
      title="다이얼로그"
      desc="네이티브 <dialog> 기반 — 포커스 트랩·ESC는 브라우저가, 표면·모션은 토큰이 담당합니다."
    >
      <div className="row">
        <Button tone="danger" variant="soft" onClick={() => setOpen(true)}>
          프로젝트 삭제…
        </Button>
        <Tooltip content="토큰으로 그린 CSS 전용 툴팁">
          <Button variant="ghost" tone="neutral">
            툴팁 호버
          </Button>
        </Tooltip>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>프로젝트를 삭제할까요?</DialogTitle>
        <DialogDescription>
          <strong>design-system-v2</strong>의 토큰 1,284개와 빌드 기록이 영구히 삭제됩니다. 되돌릴 수
          없습니다.
        </DialogDescription>
        <DialogFooter>
          <Button variant="ghost" tone="neutral" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button tone="danger" onClick={() => setOpen(false)}>
            삭제
          </Button>
        </DialogFooter>
      </Dialog>
    </Section>
  )
}

// ---------- 전체 ----------

export function Gallery({ theme, mode }: { theme: BuiltTheme; mode: Mode }) {
  return (
    <>
      <ColorsSection theme={theme} mode={mode} />
      <TypeSection />
      <ButtonsSection />
      <FormSection />
      <FeedbackSection />
      <DataSection />
      <OverlaySection />
    </>
  )
}
