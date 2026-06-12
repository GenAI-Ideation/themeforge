/**
 * 12단계 컬러 스케일 생성기 (Radix Colors의 스텝 의미론을 따른다).
 *
 *  1  앱 배경            7  훅 가능한 경계선/포커스
 *  2  미묘한 배경         8  강한 경계선
 *  3  컴포넌트 배경        9  솔리드 배경(시드 그 자체)
 *  4  컴포넌트 hover     10  솔리드 hover
 *  5  컴포넌트 active    11  저대비 텍스트 (AA 4.5:1 보장)
 *  6  미묘한 경계선       12  고대비 텍스트
 *
 * 각 스텝은 {명도 목표, 시드 채도 배율, 채도 상한}으로 정의된다.
 * 채도 상한이 있어서 시드가 아무리 쨍해도 배경 스텝은 차분하게 유지된다.
 */

import type { Oklch } from './color'
import { bestTextOn, clampToGamut, contrastRatio, ensureContrast } from './color'

export type Mode = 'light' | 'dark'
export type ContrastLevel = 'soft' | 'standard' | 'high'
export type ScaleRole = 'chromatic' | 'neutral'

interface RampStop {
  l: number
  cMul: number
  cMax: number
}

// 스텝 9, 10(솔리드)은 시드에서 직접 계산하므로 램프에서는 자리만 차지한다.
const LIGHT_RAMP: RampStop[] = [
  { l: 0.993, cMul: 0.06, cMax: 0.012 },
  { l: 0.981, cMul: 0.1, cMax: 0.022 },
  { l: 0.955, cMul: 0.18, cMax: 0.05 },
  { l: 0.928, cMul: 0.26, cMax: 0.068 },
  { l: 0.9, cMul: 0.34, cMax: 0.086 },
  { l: 0.868, cMul: 0.42, cMax: 0.104 },
  { l: 0.82, cMul: 0.54, cMax: 0.125 },
  { l: 0.74, cMul: 0.7, cMax: 0.148 },
  { l: 0, cMul: 1, cMax: 0.4 },
  { l: 0, cMul: 1, cMax: 0.4 },
  { l: 0.5, cMul: 0.65, cMax: 0.13 },
  { l: 0.26, cMul: 0.3, cMax: 0.08 },
]

const DARK_RAMP: RampStop[] = [
  { l: 0.178, cMul: 0.12, cMax: 0.02 },
  { l: 0.212, cMul: 0.16, cMax: 0.03 },
  { l: 0.252, cMul: 0.24, cMax: 0.055 },
  { l: 0.283, cMul: 0.3, cMax: 0.075 },
  { l: 0.313, cMul: 0.38, cMax: 0.095 },
  { l: 0.35, cMul: 0.46, cMax: 0.115 },
  { l: 0.422, cMul: 0.58, cMax: 0.135 },
  { l: 0.5, cMul: 0.72, cMax: 0.155 },
  { l: 0, cMul: 1, cMax: 0.4 },
  { l: 0, cMul: 1, cMax: 0.4 },
  { l: 0.8, cMul: 0.6, cMax: 0.12 },
  { l: 0.943, cMul: 0.25, cMax: 0.055 },
]

// 뉴트럴(그레이)은 채도를 거의 그대로 유지해야 "따뜻한 회색/차가운 회색" 틴트가 산다.
const NEUTRAL_MUL = [1, 1, 1, 1, 1, 1, 1, 1, 0.8, 0.8, 0.55, 0.35]
const NEUTRAL_CMAX = 0.026

export interface ScaleOptions {
  mode: Mode
  role: ScaleRole
  contrast: ContrastLevel
}

export interface BuiltScale {
  /** steps[0]이 스텝 1 */
  steps: Oklch[]
  /** 스텝 9 위 텍스트 색 (흰색 또는 근검정 자동 선택) */
  contrastText: Oklch
}

/** 시드의 솔리드(9) 명도를 실용 범위로 끌어들인다 */
function solidLightness(seed: Oklch, role: ScaleRole, mode: Mode): number {
  if (role === 'neutral') return mode === 'light' ? 0.551 : 0.555
  return Math.min(0.84, Math.max(0.47, seed.l))
}

export function buildScale(seed: Oklch, opts: ScaleOptions): BuiltScale {
  const ramp = opts.mode === 'light' ? LIGHT_RAMP : DARK_RAMP
  const steps: Oklch[] = []

  for (let i = 0; i < 12; i++) {
    const stop = ramp[i]
    let l = stop.l
    let c: number

    if (opts.role === 'neutral') {
      c = Math.min(seed.c * NEUTRAL_MUL[i], NEUTRAL_CMAX)
    } else {
      c = Math.min(seed.c * stop.cMul, stop.cMax)
    }

    // 대비 퍼스널리티: 경계선 스텝(6-8)의 강도를 조절
    if (i >= 5 && i <= 7) {
      const shift = opts.contrast === 'high' ? 0.035 : opts.contrast === 'soft' ? -0.018 : 0
      l = opts.mode === 'light' ? l - shift : l + shift
    }

    steps.push(clampToGamut({ l, c, h: seed.h }))
  }

  // ----- 솔리드 스텝 9, 10 -----
  const solidL = solidLightness(seed, opts.role, opts.mode)
  const solidC = opts.role === 'neutral' ? Math.min(seed.c, NEUTRAL_CMAX) : seed.c
  const solid = clampToGamut({ l: solidL, c: solidC, h: seed.h })
  // hover: 라이트 모드는 어둡게, 다크 모드는 밝게. 밝은 시드(노랑 등)는 항상 어둡게.
  const hoverDelta = solidL > 0.76 ? -0.05 : opts.mode === 'light' ? -0.042 : 0.045
  const hover = clampToGamut({ l: solidL + hoverDelta, c: solidC, h: seed.h })
  steps[8] = solid
  steps[9] = hover

  // ----- 텍스트 스텝 11, 12: WCAG 대비 기계적 보장 -----
  const bgRef = steps[1] // 텍스트가 주로 올라가는 미묘한 배경
  const target11 = opts.contrast === 'high' ? 7 : 4.6
  const target12 = opts.contrast === 'high' ? 13.5 : opts.contrast === 'soft' ? 9.5 : 11.5
  const dir = opts.mode === 'light' ? 'darken' : 'lighten'
  steps[10] = ensureContrast(steps[10], bgRef, target11, dir)
  steps[11] = ensureContrast(steps[11], bgRef, target12, dir)

  return { steps, contrastText: bestTextOn(solid) }
}

/** 디버그/테마 랩용: 스케일의 핵심 대비율 리포트 */
export function auditScale(scale: BuiltScale): { text: number; textHigh: number; onSolid: number } {
  return {
    text: contrastRatio(scale.steps[10], scale.steps[1]),
    textHigh: contrastRatio(scale.steps[11], scale.steps[1]),
    onSolid: contrastRatio(scale.contrastText, scale.steps[8]),
  }
}
