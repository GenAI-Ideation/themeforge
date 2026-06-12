/**
 * 타이포그래피 — 폰트 스택 레지스트리 + 모듈러 타입 스케일.
 *
 * 테마는 스택 이름('grotesk', 'serif'...)이나 임의의 font-family 문자열을
 * 지정할 수 있다. 한글 폰트(Pretendard)를 모든 스택의 폴백으로 끼워넣어
 * 국문 텍스트도 일관되게 보이도록 한다.
 */

const KR = `'Pretendard Variable', Pretendard`
const SYS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

export const FONT_STACKS = {
  sans: `'Inter', ${KR}, ${SYS}`,
  grotesk: `'Space Grotesk', ${KR}, ${SYS}`,
  humanist: `'Nunito', ${KR}, ${SYS}`,
  serif: `'Fraunces', 'Noto Serif KR', Georgia, serif`,
  display: `'Playfair Display', 'Noto Serif KR', Georgia, serif`,
  mono: `'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace`,
  system: `${KR}, ${SYS}`,
} as const

export type FontStackName = keyof typeof FONT_STACKS

export interface ResolvedFonts {
  heading: string
  body: string
  mono: string
}

/** 스택 이름이면 레지스트리에서, 아니면 원문 그대로(직접 정의 허용) */
export function resolveFont(value: string | undefined, fallback: FontStackName): string {
  if (!value) return FONT_STACKS[fallback]
  return value in FONT_STACKS ? FONT_STACKS[value as FontStackName] : value
}

export interface TypeScale {
  /** px 값. xs..4xl */
  sizes: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl', number>
  leadingBody: number
  leadingHeading: number
  trackingHeading: string
  trackingCaps: string
}

/**
 * 모듈러 스케일: base × ratio^step.
 * 디스플레이 사이즈(3xl+)는 지수를 더 크게 점프시켜 위계를 분명히 한다.
 */
export function buildTypeScale(ratio: number, base = 16): TypeScale {
  const step = (n: number) => Math.round(base * Math.pow(ratio, n) * 2) / 2
  return {
    sizes: {
      xs: step(-2),
      sm: step(-1),
      md: base,
      lg: step(1),
      xl: step(2),
      '2xl': step(3),
      '3xl': step(4.5),
      '4xl': step(6),
    },
    leadingBody: 1.6,
    leadingHeading: ratio >= 1.3 ? 1.08 : 1.2,
    // 큰 비율(드라마틱 디스플레이 타입)일수록 자간을 더 조인다
    trackingHeading: ratio >= 1.3 ? '-0.022em' : '-0.012em',
    trackingCaps: '0.07em',
  }
}
