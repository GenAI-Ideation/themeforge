/**
 * OKLCH 색공간 유틸리티.
 *
 * 왜 OKLCH인가: 지각적으로 균일(perceptually uniform)해서 L(명도)을 일정하게
 * 움직이면 사람 눈에도 일정하게 밝아진다. HSL로 스케일을 만들면 노랑은 형광이
 * 되고 파랑은 탁해지는 문제가 OKLCH에서는 생기지 않는다. 덕분에 "시드 색 하나
 * → 균질한 12단계 스케일" 자동 생성이 가능해진다.
 *
 * 변환 행렬은 Björn Ottosson의 OKLab 레퍼런스 구현을 따른다.
 */

export interface Oklch {
  /** 명도 0..1 */
  l: number
  /** 채도 0..0.4 (sRGB에서 실용 한계) */
  c: number
  /** 색상각 0..360 */
  h: number
  /** 불투명도 0..1, 생략 시 1 */
  alpha?: number
}

interface Rgb {
  r: number
  g: number
  b: number
}

// ---------- sRGB 감마 ----------

function srgbToLinear(u: number): number {
  return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4)
}

function linearToSrgb(u: number): number {
  return u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055
}

// ---------- OKLab ↔ linear sRGB ----------

function linearRgbToOklab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

function oklabToLinearRgb(L: number, a: number, b: number): Rgb {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  }
}

// ---------- 공개 변환 API ----------

export function oklchToLinearRgb(color: Oklch): Rgb {
  const hRad = (color.h * Math.PI) / 180
  return oklabToLinearRgb(color.l, color.c * Math.cos(hRad), color.c * Math.sin(hRad))
}

export function hexToOklch(hex: string): Oklch {
  let s = hex.trim().replace(/^#/, '')
  if (s.length === 3) s = s.split('').map((ch) => ch + ch).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(s)) throw new Error(`잘못된 hex 색상: ${hex}`)
  const r = srgbToLinear(parseInt(s.slice(0, 2), 16) / 255)
  const g = srgbToLinear(parseInt(s.slice(2, 4), 16) / 255)
  const b = srgbToLinear(parseInt(s.slice(4, 6), 16) / 255)
  const lab = linearRgbToOklab(r, g, b)
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b)
  let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI
  if (h < 0) h += 360
  return { l: lab.l, c: c < 1e-5 ? 0 : c, h: c < 1e-5 ? 0 : h }
}

const GAMUT_EPS = 1e-4

function inGamut(color: Oklch): boolean {
  const { r, g, b } = oklchToLinearRgb(color)
  return (
    r >= -GAMUT_EPS && r <= 1 + GAMUT_EPS &&
    g >= -GAMUT_EPS && g <= 1 + GAMUT_EPS &&
    b >= -GAMUT_EPS && b <= 1 + GAMUT_EPS
  )
}

/** sRGB 색역을 벗어나면 명도·색상은 유지한 채 채도만 이분 탐색으로 줄인다. */
export function clampToGamut(color: Oklch): Oklch {
  const l = Math.min(1, Math.max(0, color.l))
  const candidate = { ...color, l }
  if (inGamut(candidate)) return candidate
  let lo = 0
  let hi = candidate.c
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (inGamut({ ...candidate, c: mid })) lo = mid
    else hi = mid
  }
  return { ...candidate, c: lo }
}

export function oklchToHex(color: Oklch): string {
  const safe = clampToGamut(color)
  const { r, g, b } = oklchToLinearRgb(safe)
  const to255 = (u: number) =>
    Math.round(Math.min(1, Math.max(0, linearToSrgb(u))) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to255(r)}${to255(g)}${to255(b)}`
}

/** CSS `oklch()` 문자열. 모던 브라우저 네이티브 지원을 그대로 활용한다. */
export function formatOklch(color: Oklch): string {
  const safe = clampToGamut(color)
  const l = +(safe.l * 100).toFixed(2)
  const c = +safe.c.toFixed(4)
  const h = +safe.h.toFixed(2)
  const base = `oklch(${l}% ${c} ${h}`
  return safe.alpha !== undefined && safe.alpha < 1
    ? `${base} / ${+safe.alpha.toFixed(3)})`
    : `${base})`
}

// ---------- 대비(접근성) ----------

/** WCAG 상대 휘도 */
export function relativeLuminance(color: Oklch): number {
  const safe = clampToGamut(color)
  const { r, g, b } = oklchToLinearRgb(safe)
  const cl = (u: number) => Math.min(1, Math.max(0, u))
  return 0.2126 * cl(r) + 0.7152 * cl(g) + 0.0722 * cl(b)
}

/** WCAG 대비율 (1..21) */
export function contrastRatio(a: Oklch, b: Oklch): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

const WHITE: Oklch = { l: 1, c: 0, h: 0 }
const NEAR_BLACK: Oklch = { l: 0.205, c: 0, h: 0 }

/**
 * 단색 배경(solid step 9) 위에 올라갈 텍스트 색.
 * 흰색과 짙은 검정 중 대비가 높은 쪽 — 노랑/라임 계열은 자동으로 검정이 뽑힌다.
 */
export function bestTextOn(bg: Oklch): Oklch {
  const onWhite = contrastRatio(WHITE, bg)
  const onBlack = contrastRatio(NEAR_BLACK, bg)
  // 흰 텍스트를 약간 선호(같은 값이면 흰색이 더 "솔리드 버튼"답다)
  return onWhite >= onBlack * 0.92 && onWhite >= 3.4 ? WHITE : { ...NEAR_BLACK, h: bg.h, c: Math.min(0.02, bg.c * 0.2) }
}

/**
 * fg가 bg 위에서 target 대비율을 만족할 때까지 명도를 한 방향으로 이동.
 * 텍스트 스텝(11, 12)의 접근성을 기계적으로 보장하는 장치.
 */
export function ensureContrast(
  fg: Oklch,
  bg: Oklch,
  target: number,
  direction: 'darken' | 'lighten',
): Oklch {
  let cur = { ...fg }
  for (let i = 0; i < 60 && contrastRatio(cur, bg) < target; i++) {
    const nextL = direction === 'darken' ? cur.l - 0.008 : cur.l + 0.008
    if (nextL <= 0.05 || nextL >= 0.995) break
    // 명도를 옮길수록 채도를 살짝 줄여 색역 이탈과 형광색화를 막는다
    cur = { ...cur, l: nextL, c: cur.c * 0.985 }
  }
  return clampToGamut(cur)
}

// ---------- 색상각 도우미 ----------

/** from→to 최단 경로 부호 있는 각도차 (-180..180) */
export function shortestHueDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180
}

export function rotateHue(h: number, delta: number): number {
  return (((h + delta) % 360) + 360) % 360
}
