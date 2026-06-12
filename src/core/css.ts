/**
 * BuiltTheme → CSS 변수 방출기.
 *
 * 핵심 설계: 모든 토큰은 `[data-theme="이름"]` 서브트리에 스코프된다.
 * 컴포넌트는 시맨틱 변수만 읽으므로,
 *   - 페이지 루트에 붙이면 앱 전체 테마
 *   - 카드 한 장에 붙이면 그 카드만 다른 디자인 시스템
 * 이 공짜로 된다. 다크 모드도 같은 원리로 `[data-mode="dark"]` 서브트리 스코프.
 *
 * 방출 레이어는 `@layer tokens` — 사용자 오버라이드(@layer overrides)가
 * 항상 이기도록 레이어 순서로 보장한다.
 */

import { formatOklch } from './color'
import type { BuiltTheme, ModePalette } from './theme'
import { TONES } from './theme'
import {
  DENSITY_FACTOR,
  ENERGY_MOTION,
  RADIUS_FACTOR,
  type Personality,
} from './personality'
import { buildTypeScale } from './typography'

const SPACE_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]

function px(n: number): string {
  return `${+n.toFixed(2)}px`
}

// ---------- 그림자 ----------

interface ShadowLayer {
  x: number
  y: number
  blur: number
  spread: number
  alpha: number
}

const SHADOW_LEVELS: ShadowLayer[][] = [
  [{ x: 0, y: 1, blur: 2, spread: 0, alpha: 0.06 }],
  [
    { x: 0, y: 1, blur: 3, spread: 0, alpha: 0.08 },
    { x: 0, y: 1, blur: 2, spread: -1, alpha: 0.05 },
  ],
  [
    { x: 0, y: 4, blur: 10, spread: -2, alpha: 0.09 },
    { x: 0, y: 2, blur: 4, spread: -2, alpha: 0.05 },
  ],
  [
    { x: 0, y: 12, blur: 24, spread: -6, alpha: 0.11 },
    { x: 0, y: 4, blur: 8, spread: -4, alpha: 0.05 },
  ],
  [
    { x: 0, y: 24, blur: 48, spread: -12, alpha: 0.17 },
    { x: 0, y: 8, blur: 16, spread: -8, alpha: 0.07 },
  ],
]

function shadowVars(theme: BuiltTheme, palette: ModePalette, mode: 'light' | 'dark'): string[] {
  const { depth } = theme.personality
  if (depth === 'flat') {
    return [1, 2, 3, 4, 5].map((i) => `--shadow-${i}: none;`)
  }
  const mul = depth === 'subtle' ? 0.85 : depth === 'elevated' ? 1.15 : 1.45
  const blurMul = depth === 'dramatic' ? 1.5 : 1
  const darkMul = mode === 'dark' ? 2.2 : 1
  const n = palette.scales.neutral.steps[11]
  const ink = { l: mode === 'dark' ? 0.05 : 0.18, c: Math.min(n.c * 1.4, 0.03), h: n.h }
  const brandSolid = palette.scales.brand.steps[8]

  return SHADOW_LEVELS.map((layers, i) => {
    const parts = layers.map((s) => {
      const color = formatOklch({ ...ink, alpha: Math.min(0.6, s.alpha * mul * darkMul) })
      return `${s.x}px ${s.y}px ${px(s.blur * blurMul)} ${s.spread}px ${color}`
    })
    // 드라마틱 깊이: 큰 그림자에 브랜드 빛(glow)을 섞는다
    if (depth === 'dramatic' && i >= 2) {
      parts.push(`0 0 ${px(28 + i * 10)} ${formatOklch({ ...brandSolid, alpha: 0.1 })}`)
    }
    return `--shadow-${i + 1}: ${parts.join(', ')};`
  })
}

// ---------- 팔레트 변수 ----------

function paletteVars(palette: ModePalette): string[] {
  const out: string[] = []
  for (const tone of TONES) {
    const name = tone === 'neutral' ? 'gray' : tone
    const scale = palette.scales[tone]
    scale.steps.forEach((step, i) => out.push(`--${name}-${i + 1}: ${formatOklch(step)};`))
    out.push(`--${name}-contrast: ${formatOklch(scale.contrastText)};`)
  }
  out.push(
    `--bg-app: var(--gray-1);`,
    `--bg-subtle: var(--gray-2);`,
    `--bg-surface: ${formatOklch(palette.surface)};`,
    `--bg-overlay: ${palette.overlay};`,
    `--bg-component: var(--gray-3);`,
    `--bg-component-hover: var(--gray-4);`,
    `--bg-component-active: var(--gray-5);`,
    `--border-subtle: var(--gray-6);`,
    `--border: var(--gray-7);`,
    `--border-strong: var(--gray-8);`,
    `--focus-ring: var(--brand-8);`,
    `--text: var(--gray-12);`,
    `--text-muted: var(--gray-11);`,
    `--text-faint: var(--gray-10);`,
    `--selection-bg: var(--brand-5);`,
    `--link: var(--brand-11);`,
  )
  return out
}

// ---------- 퍼스널리티(모드 무관) 변수 ----------

function personalityVars(theme: BuiltTheme): string[] {
  const p: Personality = theme.personality
  const unit = 4 * DENSITY_FACTOR[p.density]
  const rf = RADIUS_FACTOR[p.radius]
  const motion = ENERGY_MOTION[p.energy]
  const type = buildTypeScale(p.typeRatio)

  const out: string[] = [
    `--font-heading: ${theme.fonts.heading};`,
    `--font-body: ${theme.fonts.body};`,
    `--font-mono: ${theme.fonts.mono};`,
  ]

  for (const [key, value] of Object.entries(type.sizes)) {
    out.push(`--text-${key}: ${px(value)};`)
  }
  out.push(
    `--leading-body: ${type.leadingBody};`,
    `--leading-heading: ${type.leadingHeading};`,
    `--tracking-heading: ${type.trackingHeading};`,
    `--tracking-caps: ${type.trackingCaps};`,
  )

  out.push(`--space-unit: ${px(unit)};`)
  SPACE_STEPS.forEach((m, i) => out.push(`--space-${i + 1}: ${px(unit * m)};`))

  out.push(
    `--radius-1: ${px(4 * rf)};`,
    `--radius-2: ${px(8 * rf)};`,
    `--radius-3: ${px(14 * rf)};`,
    `--radius-4: ${px(22 * rf)};`,
    `--radius-full: 9999px;`,
    `--radius-control: ${p.radius === 'pill' ? '9999px' : `var(--radius-2)`};`,
    `--radius-surface: var(--radius-3);`,
    `--border-width: ${px(p.borderWidth)};`,
  )

  // 컨트롤(버튼/인풋) 치수 — 밀도에 비례
  out.push(
    `--control-h-sm: ${px(unit * 8)};`,
    `--control-h-md: ${px(unit * 10)};`,
    `--control-h-lg: ${px(unit * 12)};`,
    `--control-px-sm: ${px(unit * 3)};`,
    `--control-px-md: ${px(unit * 4)};`,
    `--control-px-lg: ${px(unit * 5)};`,
    `--control-fs-sm: 13px;`,
    `--control-fs-md: 14px;`,
    `--control-fs-lg: 16px;`,
  )

  motion.durations.forEach((d, i) => out.push(`--dur-${i + 1}: ${d}ms;`))
  out.push(`--ease-out: ${motion.easeOut};`, `--ease-spring: ${motion.easeSpring};`)

  // 표면(카드) 스타일 — 깊이 퍼스널리티가 결정
  const surfaceShadow =
    p.depth === 'flat' ? 'none' : p.depth === 'subtle' ? 'var(--shadow-2)' : p.depth === 'elevated' ? 'var(--shadow-3)' : 'var(--shadow-4)'
  out.push(
    `--surface-shadow: ${surfaceShadow};`,
    `--surface-border-color: ${p.depth === 'flat' ? 'var(--border)' : 'var(--border-subtle)'};`,
  )

  return out
}

// ---------- 방출 ----------

function block(selector: string, lines: string[]): string {
  return `${selector} {\n  ${lines.join('\n  ')}\n}`
}

export interface EmitOptions {
  /** 기본값: `[data-theme="<name>"]` */
  scope?: string
}

export function emitThemeCss(theme: BuiltTheme, options: EmitOptions = {}): string {
  const scope = options.scope ?? `[data-theme="${theme.config.name}"]`

  const lightLines = [
    'color-scheme: light;',
    ...personalityVars(theme),
    ...paletteVars(theme.light),
    ...shadowVars(theme, theme.light, 'light'),
  ]
  const darkLines = [
    'color-scheme: dark;',
    ...paletteVars(theme.dark),
    ...shadowVars(theme, theme.dark, 'dark'),
  ]

  // 라이트 = 기본값 + 중첩된 명시적 light 영역, 다크 = 명시적 dark 영역(중첩 포함)
  return [
    `/* ── theme: ${theme.config.name} ── */`,
    '@layer tokens {',
    block(`${scope}, ${scope} [data-mode="light"]`, lightLines),
    block(`${scope}[data-mode="dark"], ${scope} [data-mode="dark"]`, darkLines),
    '}',
  ].join('\n')
}

// ---------- 토큰 JSON (W3C Design Tokens 형식) ----------

export function exportTokensJson(theme: BuiltTheme): Record<string, unknown> {
  const color: Record<string, unknown> = {}
  for (const mode of ['light', 'dark'] as const) {
    const modeColors: Record<string, unknown> = {}
    for (const tone of TONES) {
      const scale = theme[mode].scales[tone]
      const group: Record<string, unknown> = {}
      scale.steps.forEach((step, i) => {
        group[String(i + 1)] = { $type: 'color', $value: formatOklch(step) }
      })
      group.contrast = { $type: 'color', $value: formatOklch(scale.contrastText) }
      modeColors[tone === 'neutral' ? 'gray' : tone] = group
    }
    color[mode] = modeColors
  }

  const type = buildTypeScale(theme.personality.typeRatio)
  return {
    $description: `ThemeForge 토큰: ${theme.config.label ?? theme.config.name}`,
    color,
    typography: {
      fontFamily: {
        heading: { $type: 'fontFamily', $value: theme.fonts.heading },
        body: { $type: 'fontFamily', $value: theme.fonts.body },
        mono: { $type: 'fontFamily', $value: theme.fonts.mono },
      },
      scale: Object.fromEntries(
        Object.entries(type.sizes).map(([k, v]) => [
          k,
          { $type: 'dimension', $value: `${v}px` },
        ]),
      ),
    },
    personality: { ...theme.personality } as unknown as Record<string, unknown>,
  }
}

/** 여러 테마를 한 번에 — 데모 앱이 모든 프리셋 테마를 주입할 때 사용 */
export function emitAllThemesCss(themes: BuiltTheme[]): string {
  return themes.map((t) => emitThemeCss(t)).join('\n\n')
}
