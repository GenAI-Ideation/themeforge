/**
 * 테마 정의 → 빌드 오케스트레이터.
 *
 * 디자인 시스템 하나는 작은 시드로 환원된다:
 *   브랜드 색 1개 + 액센트 전략 + 뉴트럴 온도 + 퍼스널리티 + 폰트 페어링.
 * buildTheme()이 그 시드를 7개 톤 × 12스텝 × 2모드 = 168개 색과
 * 타이포/간격/모서리/그림자/모션 토큰으로 전개한다.
 *
 * "디자인 시스템을 찍어낸다" = ThemeConfig 객체 하나를 더 만든다.
 */

import type { Oklch } from './color'
import { clampToGamut, formatOklch, hexToOklch, rotateHue, shortestHueDelta } from './color'
import type { BuiltScale, Mode } from './scales'
import { buildScale } from './scales'
import type { MoodName, Personality } from './personality'
import { resolvePersonality } from './personality'
import type { ResolvedFonts } from './typography'
import { resolveFont } from './typography'

export const TONES = ['neutral', 'brand', 'accent', 'success', 'warning', 'danger', 'info'] as const
export type ToneName = (typeof TONES)[number]

export type AccentStrategy = 'mono' | 'analogous' | 'complementary' | 'split' | 'triadic'
export type NeutralTint = 'pure' | 'warm' | 'cool' | 'tinted'

export interface ThemeSeed {
  /** 브랜드 색. hex 문자열 또는 Oklch 객체 */
  brand: string | Oklch
  /** 직접 지정하면 전략 대신 사용 */
  accent?: string | Oklch
  /** 브랜드 색상각으로부터 액센트를 유도하는 색채 조화 전략 */
  accentStrategy?: AccentStrategy
  /** 그레이의 온도. tinted = 브랜드 색조가 스며든 그레이 */
  neutral?: NeutralTint
  /** 상태색(success 등)·액센트의 채도 배율 0.5~1.5 */
  vibrance?: number
}

export interface ThemeFonts {
  /** FONT_STACKS 이름 또는 임의의 font-family 문자열 */
  heading?: string
  body?: string
  mono?: string
}

export interface ResponsiveConfig {
  /**
   * 유체 타입 스케일. 켜면 --text-* 가 clamp()로 방출되어 뷰포트에 따라
   * 매끄럽게 변한다(모바일에서 헤드라인 축소, 본문 가독성 유지). 기본 true.
   */
  fluidType?: boolean
  /**
   * 거친 포인터(터치)에서 컨트롤 최소 높이를 44px로 보장. 기본 true.
   */
  tapTargets?: boolean
}

export interface ThemeConfig {
  /** CSS 스코프에 쓰이는 식별자 (kebab-case) */
  name: string
  label?: string
  description?: string
  seed: ThemeSeed
  /** 무드 프리셋 — 퍼스널리티의 출발점 */
  mood?: MoodName
  /** 프리셋 위에 얹는 개별 오버라이드 */
  personality?: Partial<Personality>
  fonts?: ThemeFonts
  /** 반응형 동작. 생략 시 전부 켜진 기본값 */
  responsive?: ResponsiveConfig
}

export interface ModePalette {
  scales: Record<ToneName, BuiltScale>
  /** 카드/패널 배경 (라이트: 거의 흰색, 다크: 배경보다 한 단계 위) */
  surface: Oklch
  /** 모달 뒤 오버레이 (알파 포함 CSS 문자열) */
  overlay: string
}

export interface BuiltTheme {
  config: ThemeConfig
  personality: Personality
  fonts: ResolvedFonts
  light: ModePalette
  dark: ModePalette
}

// ---------- 시드 해석 ----------

function parseColor(value: string | Oklch): Oklch {
  return typeof value === 'string' ? hexToOklch(value) : clampToGamut(value)
}

const ACCENT_DELTA: Record<AccentStrategy, number> = {
  mono: 0,
  analogous: 35,
  complementary: 180,
  split: 150,
  triadic: 120,
}

function deriveAccent(brand: Oklch, seed: ThemeSeed): Oklch {
  if (seed.accent) return parseColor(seed.accent)
  const strategy = seed.accentStrategy ?? 'analogous'
  const v = seed.vibrance ?? 1
  if (strategy === 'mono') {
    // 동일 색상각, 명도만 띄워서 위계를 만든다
    return clampToGamut({ l: Math.min(0.86, brand.l + 0.14), c: brand.c * 0.8 * v, h: brand.h })
  }
  return clampToGamut({
    l: Math.min(0.8, Math.max(0.55, brand.l)),
    c: brand.c * 0.92 * v,
    h: rotateHue(brand.h, ACCENT_DELTA[strategy]),
  })
}

function neutralSeed(brand: Oklch, tint: NeutralTint): Oklch {
  switch (tint) {
    case 'pure':
      return { l: 0.5, c: 0, h: 0 }
    case 'warm':
      return { l: 0.5, c: 0.012, h: 75 }
    case 'cool':
      return { l: 0.5, c: 0.014, h: 255 }
    case 'tinted':
      return { l: 0.5, c: 0.018, h: brand.h }
  }
}

/**
 * 상태색 표준 색상각. 브랜드 쪽으로 살짝(최대 ±8°) 끌어당겨
 * 팔레트 전체가 한 가족처럼 보이게 한다(hue harmonization).
 * 단, 의미 인지(빨강=위험)를 해치지 않는 범위만.
 */
const STATUS_HUES = { success: 152, warning: 88, danger: 27, info: 245 } as const

function statusSeed(
  status: keyof typeof STATUS_HUES,
  brand: Oklch,
  vibrance: number,
): Oklch {
  const baseHue = STATUS_HUES[status]
  const pull = Math.max(-8, Math.min(8, shortestHueDelta(baseHue, brand.h) * 0.1))
  const l = status === 'warning' ? 0.78 : 0.62
  const c = (status === 'warning' ? 0.16 : 0.15) * vibrance
  return clampToGamut({ l, c, h: rotateHue(baseHue, pull) })
}

// ---------- 빌드 ----------

function buildModePalette(
  mode: Mode,
  seeds: Record<ToneName, Oklch>,
  personality: Personality,
): ModePalette {
  const scales = {} as Record<ToneName, BuiltScale>
  for (const tone of TONES) {
    scales[tone] = buildScale(seeds[tone], {
      mode,
      role: tone === 'neutral' ? 'neutral' : 'chromatic',
      contrast: personality.contrast,
    })
  }
  const n = seeds.neutral
  const surface: Oklch =
    mode === 'light'
      ? { l: 0.998, c: Math.min(n.c * 0.25, 0.004), h: n.h }
      : { l: 0.218, c: Math.min(n.c * 1.1, 0.03), h: n.h }
  const overlay =
    mode === 'light'
      ? formatOklch({ l: 0.22, c: Math.min(n.c, 0.02), h: n.h, alpha: 0.45 })
      : formatOklch({ l: 0.06, c: 0, h: 0, alpha: 0.62 })
  return { scales, surface, overlay }
}

export function buildTheme(config: ThemeConfig): BuiltTheme {
  const brand = parseColor(config.seed.brand)
  const vibrance = config.seed.vibrance ?? 1
  const personality = resolvePersonality(config.mood, config.personality)

  const seeds: Record<ToneName, Oklch> = {
    neutral: neutralSeed(brand, config.seed.neutral ?? 'pure'),
    brand,
    accent: deriveAccent(brand, config.seed),
    success: statusSeed('success', brand, vibrance),
    warning: statusSeed('warning', brand, vibrance),
    danger: statusSeed('danger', brand, vibrance),
    info: statusSeed('info', brand, vibrance),
  }

  return {
    config,
    personality,
    fonts: {
      heading: resolveFont(config.fonts?.heading, 'sans'),
      body: resolveFont(config.fonts?.body, 'system'),
      mono: resolveFont(config.fonts?.mono, 'mono'),
    },
    light: buildModePalette('light', seeds, personality),
    dark: buildModePalette('dark', seeds, personality),
  }
}
