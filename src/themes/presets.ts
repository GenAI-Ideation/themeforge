/**
 * 프리셋 테마 — "같은 템플릿, 전혀 다른 디자인 시스템" 증명.
 *
 * 각 테마는 ThemeConfig 객체 하나다. 새 디자인 시스템을 찍어내려면
 * 여기에 객체 하나를 추가하면 끝. (README의 '30초 만에 새 테마' 참고)
 */

import type { ThemeConfig } from '../core'

export const aurora: ThemeConfig = {
  name: 'aurora',
  label: 'Aurora',
  description: '절제된 프로덕트 SaaS — 차가운 보라, 낮은 채도, 단정한 모서리',
  seed: {
    brand: '#5B5BD6',
    accentStrategy: 'analogous',
    neutral: 'cool',
  },
  mood: 'minimal',
  fonts: { heading: 'sans', body: 'system' },
}

export const tangerine: ThemeConfig = {
  name: 'tangerine',
  label: 'Tangerine',
  description: '발랄한 컨슈머 앱 — 따뜻한 오렌지, 알약 모서리, 통통 튀는 모션',
  seed: {
    brand: '#F76B15',
    accentStrategy: 'complementary',
    neutral: 'warm',
    vibrance: 1.15,
  },
  mood: 'friendly',
  fonts: { heading: 'humanist', body: 'humanist' },
}

export const noir: ThemeConfig = {
  name: 'noir',
  label: 'Noir',
  description: '럭셔리 에디토리얼 — 골드와 잉크, 세리프 디스플레이, 극적인 그림자',
  seed: {
    brand: '#A07D2B',
    accentStrategy: 'mono',
    neutral: 'warm',
    vibrance: 0.85,
  },
  mood: 'elegant',
  fonts: { heading: 'display', body: 'sans' },
}

export const terminal: ThemeConfig = {
  name: 'terminal',
  label: 'Terminal',
  description: '개발자 도구 — 포스포 그린, 고대비, 평평하고 밀도 높은 표면',
  seed: {
    brand: '#30A46C',
    accentStrategy: 'analogous',
    neutral: 'tinted',
  },
  mood: 'technical',
  fonts: { heading: 'grotesk', body: 'sans', mono: 'mono' },
}

export const blossom: ThemeConfig = {
  name: 'blossom',
  label: 'Blossom',
  description: '차분한 웰니스 — 분홍과 복숭아, 넉넉한 여백, 느린 모션',
  seed: {
    brand: '#E54D8A',
    accentStrategy: 'analogous',
    neutral: 'warm',
    vibrance: 0.9,
  },
  mood: 'tranquil',
  fonts: { heading: 'serif', body: 'system' },
}

export const cobalt: ThemeConfig = {
  name: 'cobalt',
  label: 'Cobalt',
  description: '브루탈리스트 포스터 — 강한 파랑×노랑, 각진 모서리, 두꺼운 보더',
  seed: {
    brand: '#2A5CFF',
    accent: '#F5B800',
    neutral: 'pure',
    vibrance: 1.2,
  },
  mood: 'bold',
  fonts: { heading: 'grotesk', body: 'sans' },
}

export const PRESETS: ThemeConfig[] = [aurora, tangerine, noir, terminal, blossom, cobalt]
