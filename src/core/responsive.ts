/**
 * 반응형 기반 — 브레이크포인트 + 유체(fluid) 스케일 수학. 의존성 0.
 *
 * 철학: 모바일 대응은 "별도 모드"가 아니라 토큰의 한 차원이다.
 *   - 타입/간격은 뷰포트에 따라 clamp()로 매끄럽게 변한다(유체 스케일).
 *   - 컨트롤은 거친 포인터(터치)에서 최소 탭 타깃(44px)을 보장받는다.
 *   - 레이아웃 프리미티브는 브레이크포인트별 커스텀 프로퍼티를 소비한다.
 * 그래서 한 번 빌드한 테마가 폰부터 와이드 모니터까지 그대로 동작한다.
 */

/** Tailwind 관례를 따른 브레이크포인트(px). 널리 통용되어 학습 비용이 없다. */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export type BreakpointName = keyof typeof BREAKPOINTS

/** 레이아웃 프리미티브의 반응형 prop 키 — base는 모바일 우선 기본값 */
export const RESPONSIVE_KEYS = ['base', 'sm', 'md', 'lg', 'xl'] as const
export type ResponsiveKey = (typeof RESPONSIVE_KEYS)[number]

/** 유체 스케일이 보간되는 뷰포트 구간 (px) */
export interface FluidRange {
  min: number
  max: number
}

export const DEFAULT_FLUID_RANGE: FluidRange = { min: 380, max: 1280 }

/** WCAG/Apple HIG/Material 공통 최소 터치 타깃(px) */
export const TAP_TARGET_MIN = 44

const r2 = (n: number) => Math.round(n * 100) / 100
const r3 = (n: number) => Math.round(n * 1000) / 1000

/**
 * 두 픽셀 값을 뷰포트에 따라 보간하는 zoom-safe clamp() 식을 만든다.
 *
 * preferred 항을 `rem + vw` 조합으로 표현하는 이유: vw 단독이면 브라우저
 * 줌이 글자 크기에 반영되지 않아 접근성에 해롭다. rem 절편을 섞으면
 * 사용자 글꼴 크기/줌이 존중된다.
 */
export function fluidClamp(
  minPx: number,
  maxPx: number,
  range: FluidRange = DEFAULT_FLUID_RANGE,
): string {
  if (Math.abs(minPx - maxPx) < 0.05) return `${r2(minPx)}px`
  const slope = (maxPx - minPx) / (range.max - range.min)
  const interceptPx = minPx - slope * range.min
  const interceptRem = interceptPx / 16
  const vw = slope * 100
  const lo = Math.min(minPx, maxPx)
  const hi = Math.max(minPx, maxPx)
  // 절편은 선두 항이라 부호를 그대로 달고, vw 항만 명시적 ±로 — `+ -` 같은
  // 모호한 표기를 피해 모든 엔진에서 안전한 calc-sum 을 만든다.
  const vwSign = vw < 0 ? '-' : '+'
  return `clamp(${r2(lo)}px, ${r3(interceptRem)}rem ${vwSign} ${r3(Math.abs(vw))}vw, ${r2(hi)}px)`
}

/** min-width 미디어 쿼리 한 줄 — 레이아웃 CSS 생성에 쓰인다 */
export function mq(bp: BreakpointName): string {
  return `@media (min-width: ${BREAKPOINTS[bp]}px)`
}
