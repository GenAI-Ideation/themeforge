/**
 * 퍼스널리티 시스템 — 색이 "무엇"이라면 퍼스널리티는 "어떻게"다.
 *
 * 디자인 시스템의 분위기는 색보다 이쪽이 좌우한다:
 * 모서리(radius), 밀도(density), 깊이(depth/그림자), 대비(contrast),
 * 에너지(motion), 타입 스케일 비율, 보더 두께.
 *
 * 무드 프리셋은 이 파라미터들의 검증된 조합이다. 프리셋을 고르고
 * 일부만 오버라이드하는 식으로 쓴다.
 */

import type { ContrastLevel } from './scales'

export type RadiusStyle = 'sharp' | 'subtle' | 'rounded' | 'pill'
export type Density = 'compact' | 'comfortable' | 'spacious'
export type Depth = 'flat' | 'subtle' | 'elevated' | 'dramatic'
export type Energy = 'calm' | 'balanced' | 'lively'

export interface Personality {
  radius: RadiusStyle
  density: Density
  contrast: ContrastLevel
  depth: Depth
  energy: Energy
  /** 타입 스케일 공비. 1.16(차분) ~ 1.333(드라마틱) */
  typeRatio: number
  /** 컨트롤 보더 두께(px) */
  borderWidth: number
}

export type MoodName = 'minimal' | 'friendly' | 'elegant' | 'technical' | 'bold' | 'tranquil'

export const MOODS: Record<MoodName, Personality> = {
  /** 절제된 SaaS — 군더더기 없는 기본값 */
  minimal: {
    radius: 'subtle',
    density: 'comfortable',
    contrast: 'standard',
    depth: 'subtle',
    energy: 'balanced',
    typeRatio: 1.2,
    borderWidth: 1,
  },
  /** 친근한 컨슈머 — 둥글고 통통 튀는 */
  friendly: {
    radius: 'pill',
    density: 'comfortable',
    contrast: 'soft',
    depth: 'elevated',
    energy: 'lively',
    typeRatio: 1.22,
    borderWidth: 1.5,
  },
  /** 럭셔리/에디토리얼 — 큰 타입 대비, 낮은 채도, 여백 */
  elegant: {
    radius: 'sharp',
    density: 'spacious',
    contrast: 'soft',
    depth: 'dramatic',
    energy: 'calm',
    typeRatio: 1.333,
    borderWidth: 1,
  },
  /** 개발자 도구 — 밀도 높고 평평하고 정직한 */
  technical: {
    radius: 'subtle',
    density: 'compact',
    contrast: 'high',
    depth: 'flat',
    energy: 'balanced',
    typeRatio: 1.16,
    borderWidth: 1,
  },
  /** 브루탈리스트 — 강한 대비, 각진 모서리, 두꺼운 보더 */
  bold: {
    radius: 'sharp',
    density: 'comfortable',
    contrast: 'high',
    depth: 'flat',
    energy: 'lively',
    typeRatio: 1.25,
    borderWidth: 2,
  },
  /** 차분한 웰니스 — 부드럽고 느리고 흐릿한 */
  tranquil: {
    radius: 'rounded',
    density: 'spacious',
    contrast: 'soft',
    depth: 'subtle',
    energy: 'calm',
    typeRatio: 1.2,
    borderWidth: 1,
  },
}

export function resolvePersonality(
  mood: MoodName | undefined,
  overrides: Partial<Personality> | undefined,
): Personality {
  const base = MOODS[mood ?? 'minimal']
  return { ...base, ...overrides }
}

// ---------- 파생 수치 ----------

export const DENSITY_FACTOR: Record<Density, number> = {
  compact: 0.85,
  comfortable: 1,
  spacious: 1.15,
}

export const RADIUS_FACTOR: Record<RadiusStyle, number> = {
  sharp: 0,
  subtle: 0.6,
  rounded: 1.1,
  pill: 1.4,
}

export interface MotionSpec {
  durations: [number, number, number]
  easeOut: string
  easeSpring: string
}

export const ENERGY_MOTION: Record<Energy, MotionSpec> = {
  calm: {
    durations: [180, 320, 520],
    easeOut: 'cubic-bezier(0.25, 0.8, 0.3, 1)',
    easeSpring: 'cubic-bezier(0.3, 1.05, 0.4, 1)',
  },
  balanced: {
    durations: [140, 240, 400],
    easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
    easeSpring: 'cubic-bezier(0.3, 1.25, 0.4, 1)',
  },
  lively: {
    durations: [110, 190, 320],
    easeOut: 'cubic-bezier(0.18, 1, 0.3, 1)',
    easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
}
