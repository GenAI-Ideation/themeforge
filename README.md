# ThemeForge ⚒

**디자인 시스템을 찍어내는 디자인 시스템 템플릿.**

시드 색 1개 + 퍼스널리티 파라미터 몇 개 → 완성된 디자인 시스템(84색 팔레트 · 타이포 ·
간격 · 모서리 · 그림자 · 모션 + 16개 컴포넌트)이 나옵니다. 테마 정의 객체 하나를 더
만들면 시스템이 하나 더 나옵니다.

```bash
npm install
npm run dev   # http://localhost:5273
```

데모에는 분위기가 완전히 다른 프리셋 6종(Aurora·Tangerine·Noir·Terminal·Blossom·Cobalt)과
**테마 랩**(슬라이더로 실시간 생성 → CSS/JSON 내보내기)이 들어 있습니다.

---

## 30초 만에 새 디자인 시스템

[src/themes/presets.ts](src/themes/presets.ts)에 객체 하나를 추가하면 끝:

```ts
export const ocean: ThemeConfig = {
  name: 'ocean',
  label: 'Ocean',
  seed: {
    brand: '#0E7490',          // 이 색 하나에서 84색이 전개된다
    accentStrategy: 'split',   // 색채 조화 이론으로 액센트 유도
    neutral: 'cool',           // 그레이의 온도
  },
  mood: 'tranquil',            // 모서리·밀도·그림자·모션 프리셋
  personality: { radius: 'pill' },  // 프리셋 일부만 오버라이드
  fonts: { heading: 'serif', body: 'system' },
}
```

`PRESETS` 배열에 넣으면 데모 헤더에 자동으로 등장합니다.
코드 없이 만들고 싶으면 **테마 랩**에서 슬라이더로 빚은 뒤 `theme.css`를 다운로드하세요.

---

## 아키텍처 — 왜 "찍어내기"가 가능한가

```
씨앗 (ThemeConfig)            엔진 (src/core)                  소비 (src/ui)
─────────────────            ────────────────────────────     ─────────────────
brand: '#5B5BD6'      ──►    OKLCH 12스텝 스케일 × 7톤   ──►   컴포넌트는
accentStrategy       ──►    × 라이트/다크 (대비 자동보정)      시맨틱 변수만 읽음
neutral 온도          ──►    시맨틱 매핑 (--bg-*, --text-*)     (--tone-9, --radius-control,
mood / personality   ──►    간격·모서리·그림자·모션 토큰        --space-4, --shadow-2 …)
fonts                ──►    타입 스케일 + 폰트 스택
                             │
                             ▼
                     [data-theme="이름"] 스코프 CSS 변수
```

세 가지 설계 원칙:

1. **토큰 3층 구조** — 원시값(스케일)→ 시맨틱(`--bg-app`, `--text-muted`)→ 컴포넌트
   (`--control-h-md`). 컴포넌트는 아래층을 직접 만지지 않으므로 테마 교체가 무손실입니다.
2. **서브트리 스코프** — 토큰이 `[data-theme]`/`[data-mode]` 속성에 스코프됩니다.
   페이지 루트에 붙이면 앱 전체, 카드 한 장에 붙이면 그 카드만. 한 화면에 여러 시스템 공존 가능
   (데모의 "같은 컴포넌트, 여섯 개의 시스템" 섹션).
3. **CSS @layer 우선순위** — `tokens → base → tones → components → overrides`.
   사용자는 `@layer overrides`에 쓰기만 하면 specificity 전쟁 없이 무조건 이깁니다.

### 색 엔진 (src/core/color.ts · scales.ts)

- **OKLCH 색공간**: 지각적으로 균일해서 어떤 색상각에서도 명도 곡선이 똑같이 동작
  (HSL이라면 노랑은 형광, 파랑은 탁해짐). 같은 곡선으로 12스텝을 전개하므로 시드가 무엇이든
  스케일 품질이 일정합니다.
- **스텝 의미론(Radix 방식)**: 1-2 배경 / 3-5 컴포넌트 / 6-8 경계선 / 9-10 솔리드 / 11-12 텍스트.
- **접근성 기계 보장**: 텍스트 스텝(11·12)은 WCAG 대비율(4.5:1 / 11.5:1)을 만족할 때까지
  명도를 자동 보정. 솔리드(9) 위 텍스트도 흰색/검정을 자동 선택(노랑 → 검정).
- **색역 클램핑**: sRGB를 벗어나면 명도·색상각은 유지한 채 채도만 이분 탐색으로 감쇠.
- **Hue harmonization**: success/warning/danger/info를 브랜드 색상각 쪽으로 최대 ±8°만
  끌어와 — 의미(빨강=위험)는 지키면서 팔레트를 한 가족으로 만듭니다.
- **액센트 전략**: 보색/유사색/분열보색/삼각배색/단색 — 색채 조화 이론으로 두 번째 색을 유도.

### 퍼스널리티 (src/core/personality.ts)

색이 "무엇"이라면 퍼스널리티는 "어떻게"입니다:

| 파라미터 | 값 | 결정하는 것 |
|---|---|---|
| `radius` | sharp · subtle · rounded · pill | 모서리 전반 + 컨트롤 모양 |
| `density` | compact · comfortable · spacious | 간격 단위(–15% ~ +15%), 컨트롤 높이 |
| `contrast` | soft · standard · high | 경계선 강도, 텍스트 대비 목표치 |
| `depth` | flat · subtle · elevated · dramatic | 그림자 5단계 (flat은 보더로 대체, dramatic은 브랜드 글로우) |
| `energy` | calm · balanced · lively | 모션 시간·이징(lively는 스프링 오버슈트) |
| `typeRatio` | 1.12 ~ 1.4 | 타입 스케일 공비 (1.333 = 드라마틱 에디토리얼) |
| `borderWidth` | 1 · 1.5 · 2 | 컨트롤 보더 두께 (2px = 브루탈리스트) |

무드 프리셋(minimal/friendly/elegant/technical/bold/tranquil)은 이 7개의 검증된 조합이고,
개별 오버라이드를 얹을 수 있습니다.

---

## 컴포넌트 파라미터 시스템

모든 컴포넌트는 **변형(variant) × 톤(tone) × 크기(size)** 직교 좌표계 위에 있습니다:

```tsx
<Button variant="soft" tone="danger" size="lg">삭제</Button>
<Badge variant="outline" tone="success" dot>가동 중</Badge>
<Alert tone="warning" variant="solid" title="경고" />
```

비밀은 [tones.css](src/ui/styles/tones.css)의 **톤 리매핑**입니다:

```css
[data-tone='danger'] { --tone-9: var(--danger-9); /* …12스텝+contrast */ }
```

변형은 `--tone-*`만 소비합니다 (`[data-variant='solid'] { background: var(--tone-9) }`).
그래서 **새 톤 추가 = 13줄짜리 블록 하나**, **새 변형 추가 = CSS 한 블록**이고,
서로의 조합은 공짜로 생깁니다. `data-tone`을 컨테이너에 걸면 서브트리 기본 톤도 바뀝니다.

---

## 모바일은 "모드"가 아니라 토큰의 한 차원

반응형은 별도 모드가 아니라 빌드된 테마에 처음부터 박혀 있습니다. 한 번 찍어낸
디자인 시스템이 폰부터 와이드 모니터까지 그대로 동작합니다.

### 1. 유체 타입 (자동)

`--text-*`가 `clamp()`로 방출되어 뷰포트에 따라 매끄럽게 변합니다. 단순 축소가 아니라
**위계 압축**입니다 — 작은 화면에서 본문/작은 텍스트는 오히려 약간 커지고(가독성 + iOS 줌
방지), 헤드라인/디스플레이는 크게 줄어듭니다. zoom-safe하게 `rem + vw`로 표현해 사용자
글꼴 크기/브라우저 줌을 존중합니다.

```css
--text-4xl: clamp(31.5px, 1.53rem + 1.83vw, 48px);  /* 폰 31.5 → 데스크톱 48 */
--text-md:  16px;                                     /* 본문은 16px 고정(iOS 줌 차단) */
```

### 2. 터치 타깃 바닥값 (자동)

거친 포인터(터치)에서 모든 컨트롤이 최소 44px(WCAG/Apple HIG/Material 공통 기준)을
보장받습니다. compact 밀도에서 32px이던 sm 버튼이 터치에서는 44px로 자랍니다.

```css
--control-h-sm: max(32px, var(--tap-min));   /* --tap-min: 0 → 마우스, 44px → 터치 */
```

정밀 포인터(마우스)에서는 디자이너가 정한 밀도를 그대로 둡니다. `:hover`도 `@media (hover:
hover)`로 가드해 터치에서 sticky hover가 남지 않고, 입력 폰트는 터치에서 16px로 떠
iOS 포커스 줌을 막습니다.

끄고 싶으면 테마에서:

```ts
{ name: 'my-system', seed: {...}, responsive: { fluidType: false, tapTargets: false } }
```

### 3. 반응형 레이아웃 프리미티브

`{ base, sm, md, lg, xl }` 반응형 prop을 받는 4종 — 미디어 쿼리 JS 0개, SSR 안전.

```tsx
<Container size="lg">                                {/* 중앙 정렬 + 유체 거터 + safe-area */}
  <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap={4}>    {/* 1열 → 2열 → 4열 */}
  <Grid min="240px">                                  {/* 컨테이너에 맞춰 자동 줄바꿈 */}
  <Stack direction={{ base: 'column', md: 'row' }}>   {/* 모바일 세로 → md 가로 */}
  <Cluster gap={2}>…</Cluster>                         {/* 줄바꿈 가로 묶음(태그·버튼) */}
</Container>
```

원리: 컴포넌트가 `--<name>-<bp>` 커스텀 프로퍼티를 인라인으로 박고,
[layout.css](src/ui/styles/layout.css)의 미디어 쿼리가 `var()` 폴백 체인으로
소비합니다(모바일 우선 — 지정 안 한 단계는 더 작은 단계를 물려받음).

### 4. 모바일 적응 컴포넌트

- **Dialog** `placement="auto"` — 좁은 화면에선 **바텀시트**(하단 슬라이드, safe-area
  보정, 그랩 핸들), 넓은 화면에선 중앙 모달.
- **Table / DataTable** `stackOnMobile` — 좁은 화면에서 표가 **카드 더미**가 됩니다.
  `DataTable`은 셀 라벨을 컬럼 헤더에서 자동으로 채웁니다.
- **Tabs** — 넘치면 줄바꿈 대신 가로 스크롤(스크롤바 숨김 + 스냅).

브레이크포인트는 `sm 640 · md 768 · lg 1024 · xl 1280`([core/responsive.ts](src/core/responsive.ts)),
Tailwind 관례와 동일합니다.

## 전문가 모드 — 다이어그램도 토큰을 입는다

개발자/설계자를 위한 SVG 다이어그램 컴포넌트: **순서도(FlowDiagram) · 시퀀스
(SequenceDiagram) · 상태 머신**(FlowDiagram + `state/initial/final`). 데이터는 순수
객체, 시각 언어는 전부 테마 토큰입니다 — 테마를 바꾸면 다이어그램이 다시 태어납니다.

```tsx
import { FlowDiagram, SequenceDiagram, downloadSvg } from './diagram'

<FlowDiagram
  direction="down"            // down | right
  edgeStyle="smooth"          // smooth(곡선) | orthogonal(직각)
  nodes={[
    { id: 'start', kind: 'terminal', label: '시작', tone: 'brand' },
    { id: 'check', kind: 'decision', label: '유효?' },
    { id: 'issue', kind: 'subroutine', label: 'JWT 발급', variant: 'solid' },
    // kind: process · decision · terminal · io · subroutine · state · initial · final
  ]}
  edges={[
    { from: 'start', to: 'check' },
    { from: 'check', to: 'issue', label: '예', tone: 'success' },
    { from: 'check', to: 'start', label: '재시도', dashed: true },  // 루프백 자동 우회
    { from: 'issue', to: 'issue', label: '갱신' },                  // 셀프 루프
    { from: 'issue', to: 'done', active: true },                    // 흐르는 점선 강조
  ]}
/>

<SequenceDiagram
  actors={[{ id: 'app', label: '클라이언트', tone: 'brand' }, …]}
  messages={[
    { from: 'app', to: 'api', label: 'POST /payments' },            // sync
    { from: 'api', to: 'app', label: '201', kind: 'return' },       // 점선 + 빈 화살촉
    { from: 'api', to: 'app', label: 'webhook', kind: 'async' },
    { from: 'api', to: 'api', label: '검증' },                       // self 루프
  ]}
/>  {/* 활성 구간(activation bar)은 sync/return 호출 스택에서 자동 계산 */}
```

작동 원리 — UI 컴포넌트와 똑같은 규칙:

| 다이어그램 요소 | 소비하는 토큰 |
|---|---|
| 노드 색 | `data-tone × data-variant` — tones.css 리매핑 **재사용** |
| 노드 모서리 | radius 퍼스널리티 (`--radius-control/-2/-3`) — sharp 테마 = 각진 노드 |
| 선 굵기 · 화살촉 | `--border-width` (2px = 브루탈리스트 다이어그램) |
| 간격 | `--space-unit` — 밀도 퍼스널리티에 비례 |
| 라벨 폰트 | `--font-body`, 대비 보장된 `--tone-11/12` |
| `active` 간선 흐름 속도 | 모션 토큰 `--dur-3` (energy 퍼스널리티) |

- **자동 레이아웃**: 의존성 0의 계층형(Sugiyama-lite) 엔진 — 역방향 간선 검출(루프백
  레인 우회), 최장 경로 레이어링, barycenter 교차 최소화, 분기 부채꼴, 레이어 건너뛰기
  우회. 수십 노드 규모용 휴리스틱이며 수백 노드급은 ELK/dagre를 어댑터로 권장.
- **SVG 내보내기**: `downloadSvg(svgEl, '이름')` — getComputedStyle로 현재 테마 값을
  presentation 속성으로 구워 넣은 **standalone SVG**. 문서/위키/Figma에 바로.
- 노드 크기는 canvas `measureText`로 실측(한글 폭 정확), 토큰 수치는
  `useDiagramMetrics`가 CSS 변수를 읽어 레이아웃에 공급합니다.

## 확장 레시피

### 1. 새 변형 추가 — "glow" 버튼

```css
/* 아무 CSS 파일에나 */
@layer overrides {
  .tf-btn[data-variant='glow'] {
    background: var(--tone-9);
    color: var(--tone-contrast);
    box-shadow: 0 0 20px var(--tone-7), 0 0 60px var(--tone-5);
  }
}
```

```tsx
<Button variant="glow">빛나는 버튼</Button>   {/* 타입 에러 없음 — 의도된 설계 */}
```

`Variant` 타입이 `'solid' | … | (string & {})`이라 자동완성은 유지하면서
커스텀 문자열도 통과시킵니다. 모든 톤에서 즉시 동작합니다.

### 2. 기존 컴포넌트 스타일 오버라이드

```css
@layer overrides {
  .tf-card { border-width: 2px; backdrop-filter: blur(8px); }
}
```

레이어 순서상 `overrides`가 `components`를 항상 이기므로 specificity 고민이 없습니다.

### 3. 컴포넌트 완전 재정의

마크업은 시맨틱 HTML + data 속성뿐이므로, [src/ui/index.ts](src/ui/index.ts)에서
해당 컴포넌트의 CSS import를 자신의 파일로 교체하면 룩을 통째로 바꿀 수 있습니다.
React 레이어(동작·접근성)는 그대로 재사용됩니다.

### 4. 마크업 교체 (asChild)

```tsx
<Button asChild variant="outline">
  <a href="/docs">버튼처럼 보이는 링크</a>
</Button>
```

### 5. 다른 프레임워크로 이식

테마 랩 → "CSS 복사"는 `:root` 스코프 standalone CSS를 줍니다. 토큰과 컴포넌트 CSS는
React를 모르는 순수 CSS이므로 Vue/Svelte/플레인 HTML에서도 클래스와 data 속성만 맞추면
그대로 동작합니다. `tokens.json`(W3C Design Tokens 형식)은 Figma Tokens 등으로.

### 6. 런타임 테마 생성

```ts
import { buildTheme, emitThemeCss } from './core'

const css = emitThemeCss(buildTheme({
  name: 'user-theme',
  seed: { brand: userPickedColor },   // 사용자가 고른 색으로
  mood: 'friendly',
}))
// <style>에 주입 — 사용자별 화이트라벨링이 이 한 줄
```

---

## 토큰 레퍼런스 (컴포넌트가 읽는 것들)

| 그룹 | 변수 | 비고 |
|---|---|---|
| 배경 | `--bg-app` `--bg-subtle` `--bg-surface` `--bg-overlay` | 표면 위계 |
| 컴포넌트 배경 | `--bg-component(-hover,-active)` | 인터랙션 3단계 |
| 경계선 | `--border-subtle` `--border` `--border-strong` `--focus-ring` | |
| 텍스트 | `--text` `--text-muted` `--text-faint` `--link` | 11·12스텝, AA 보장 |
| 스케일 | `--gray-1..12` `--brand-1..12` `--accent-*` `--success-*` `--warning-*` `--danger-*` `--info-*` | + `--{톤}-contrast` |
| 톤(역할) | `--tone-1..12` `--tone-contrast` | `data-tone`이 리매핑 |
| 타이포 | `--font-heading/body/mono` `--text-xs..4xl` `--leading-*` `--tracking-*` | |
| 간격 | `--space-unit` `--space-1..12` | 밀도에 비례 |
| 모서리 | `--radius-1..4` `--radius-control` `--radius-surface` `--radius-full` | |
| 깊이 | `--shadow-1..5` `--surface-shadow` `--surface-border-color` | depth가 결정 |
| 모션 | `--dur-1..3` `--ease-out` `--ease-spring` | energy가 결정 |
| 컨트롤 | `--control-h-sm/md/lg` `--control-px-*` `--control-fs-*` | 버튼·인풋 공용 |
| 반응형 | `--text-*`(유체 clamp) `--tap-min` | 터치에서 `--tap-min`→44px, 컨트롤 높이 바닥값 |

## 디렉터리 구조

```
src/
  core/        # 프레임워크 무관 토큰 엔진 (의존성 0)
    color.ts        # OKLCH 수학, 색역 클램핑, WCAG 대비
    scales.ts       # 12스텝 램프 + 대비 자동 보정
    personality.ts  # 무드 프리셋, 밀도/모서리/모션 수치
    typography.ts   # 폰트 스택 레지스트리, 모듈러 스케일 + 모바일 스케일
    responsive.ts   # 브레이크포인트 + 유체 clamp 수학 + 탭 타깃 상수
    theme.ts        # ThemeConfig → BuiltTheme 오케스트레이터
    css.ts          # CSS 변수 방출(유체 타입·탭 바닥값) + 토큰 JSON 내보내기
  themes/      # ★ 디자인 시스템들이 사는 곳 (1테마 = 1객체)
  ui/          # 파라미터화된 컴포넌트 + 반응형 레이아웃 프리미티브
    Layout.tsx      # Container · Stack · Grid · Cluster (반응형 prop)
    styles/         # 컴포넌트별 CSS (교체 가능 단위)
  diagram/     # 전문가 모드: 순서도·시퀀스·상태머신 (자동 레이아웃 + SVG 내보내기)
  demo/        # 쇼케이스 + 테마 랩
```

## 들어 있는 컴포넌트

Button · Badge · Card · Input · Textarea · Select · Field · Checkbox · Radio · Switch ·
Alert · Tabs · Dialog · Table · Avatar · Progress · Skeleton · Separator · Kbd · Spinner · Tooltip
**+ Container · Stack · Grid · Cluster** (반응형 레이아웃) · **DataTable**(모바일 스택)
**+ FlowDiagram · SequenceDiagram** (전문가 모드)

전부 네이티브 요소 기반(접근성 내장), 토큰만 소비, 변형/톤/크기 파라미터화.
