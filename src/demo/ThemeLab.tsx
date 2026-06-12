/**
 * 테마 랩 — 슬라이더를 움직이는 순간 새 디자인 시스템이 "찍혀 나온다".
 * 내부적으로는 LabState → ThemeConfig → buildTheme → CSS 주입의 파이프라인.
 * 완성된 시스템은 CSS(:root 스코프)나 토큰 JSON으로 내보낼 수 있다.
 */

import { useState } from 'react'
import type {
  AccentStrategy,
  BuiltTheme,
  ContrastLevel,
  Density,
  Depth,
  Energy,
  MoodName,
  NeutralTint,
  RadiusStyle,
  ThemeConfig,
} from '../core'
import {
  auditScale,
  emitThemeCss,
  exportTokensJson,
  MOODS,
  oklchToHex,
  hexToOklch,
  FONT_STACKS,
} from '../core'
import type { FontStackName } from '../core'
import { Badge, Button, Select } from '../ui'
import tonesCss from '../ui/styles/tones.css?raw'

// ---------- 상태 ----------

export interface LabState {
  hue: number
  chroma: number
  lightness: number
  accentStrategy: AccentStrategy
  neutral: NeutralTint
  vibrance: number
  mood: MoodName
  radius: RadiusStyle
  density: Density
  contrast: ContrastLevel
  depth: Depth
  energy: Energy
  typeRatio: number
  borderWidth: number
  headingFont: FontStackName
  bodyFont: FontStackName
}

export const DEFAULT_LAB: LabState = {
  hue: 277,
  chroma: 0.165,
  lightness: 0.55,
  accentStrategy: 'analogous',
  neutral: 'cool',
  vibrance: 1,
  mood: 'minimal',
  ...MOODS.minimal,
  headingFont: 'sans',
  bodyFont: 'system',
}

export function labToConfig(s: LabState): ThemeConfig {
  return {
    name: 'custom',
    label: 'Custom',
    description: '테마 랩에서 방금 찍어낸 시스템',
    seed: {
      brand: { l: s.lightness, c: s.chroma, h: s.hue },
      accentStrategy: s.accentStrategy,
      neutral: s.neutral,
      vibrance: s.vibrance,
    },
    mood: s.mood,
    personality: {
      radius: s.radius,
      density: s.density,
      contrast: s.contrast,
      depth: s.depth,
      energy: s.energy,
      typeRatio: s.typeRatio,
      borderWidth: s.borderWidth,
    },
    fonts: { heading: s.headingFont, body: s.bodyFont },
  }
}

const FONT_PAIRS: Array<[FontStackName, FontStackName]> = [
  ['sans', 'system'],
  ['grotesk', 'sans'],
  ['humanist', 'humanist'],
  ['serif', 'sans'],
  ['display', 'sans'],
  ['mono', 'sans'],
]

export function randomLab(): LabState {
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const mood = pick(Object.keys(MOODS) as MoodName[])
  const [headingFont, bodyFont] = pick(FONT_PAIRS)
  return {
    hue: Math.round(Math.random() * 360),
    chroma: +(0.12 + Math.random() * 0.13).toFixed(3),
    lightness: +(0.52 + Math.random() * 0.2).toFixed(3),
    accentStrategy: pick(['mono', 'analogous', 'complementary', 'split', 'triadic'] as const),
    neutral: pick(['pure', 'warm', 'cool', 'tinted'] as const),
    vibrance: 1,
    mood,
    ...MOODS[mood],
    headingFont,
    bodyFont,
  }
}

// ---------- 내보내기 ----------

function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 어디서나 쓸 수 있는 standalone CSS: :root 스코프 토큰 + 톤 리매핑 */
export function exportStandaloneCss(theme: BuiltTheme): string {
  return [
    '/* ThemeForge 토큰 — html에 data-mode="dark"를 토글하면 다크 모드 */',
    emitThemeCss(theme, { scope: ':root' }),
    tonesCss,
  ].join('\n\n')
}

// ---------- 컨트롤 ----------

interface RangeRowProps {
  label: string
  value: number
  display: string
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

function RangeRow({ label, value, display, min, max, step, onChange }: RangeRowProps) {
  return (
    <label className="lab-row">
      <span className="lab-row-head">
        <span>{label}</span>
        <output>{display}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

interface SelectRowProps<T extends string> {
  label: string
  value: T
  options: Array<[T, string]>
  onChange: (v: T) => void
}

function SelectRow<T extends string>({ label, value, options, onChange }: SelectRowProps<T>) {
  return (
    <label className="lab-row">
      <span className="lab-row-head">
        <span>{label}</span>
      </span>
      <Select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </Select>
    </label>
  )
}

// ---------- 본체 ----------

export interface ThemeLabProps {
  state: LabState
  theme: BuiltTheme
  onChange: (next: LabState) => void
  onClose: () => void
}

export function ThemeLab({ state, theme, onChange, onClose }: ThemeLabProps) {
  const [copied, setCopied] = useState(false)
  const set = <K extends keyof LabState>(key: K, value: LabState[K]) =>
    onChange({ ...state, [key]: value })

  const seedHex = oklchToHex({ l: state.lightness, c: state.chroma, h: state.hue })
  const audit = auditScale(theme.light.scales.brand)
  const auditGray = auditScale(theme.light.scales.neutral)

  const applyMood = (mood: MoodName) => onChange({ ...state, mood, ...MOODS[mood] })

  const copyCss = async () => {
    await navigator.clipboard.writeText(exportStandaloneCss(theme))
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <aside className="lab" aria-label="테마 랩">
      <div className="lab-title">
        <span>🧪 테마 랩</span>
        <span className="row" style={{ gap: 'var(--space-2)' }}>
          <Button size="sm" variant="soft" tone="accent" onClick={() => onChange(randomLab())}>
            🎲 랜덤
          </Button>
          <Button size="sm" variant="ghost" tone="neutral" iconOnly onClick={onClose} aria-label="닫기">
            ✕
          </Button>
        </span>
      </div>

      <div className="lab-group" style={{ borderTop: 'none', paddingTop: 0 }}>
        <span className="lab-group-label">씨앗 색 (브랜드)</span>
        <div className="lab-seed-preview">
          <span className="lab-seed-swatch" style={{ background: seedHex }}>
            <input
              type="color"
              value={seedHex}
              aria-label="브랜드 색 직접 선택"
              onChange={(e) => {
                const c = hexToOklch(e.target.value)
                onChange({ ...state, hue: c.h, chroma: c.c, lightness: c.l })
              }}
            />
          </span>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>{seedHex}</div>
            <div className="tf-hint">
              oklch({(state.lightness * 100).toFixed(0)}% {state.chroma.toFixed(3)} {state.hue.toFixed(0)})
            </div>
          </div>
        </div>
        <RangeRow label="색상각 Hue" value={state.hue} display={`${state.hue.toFixed(0)}°`} min={0} max={360} step={1} onChange={(v) => set('hue', v)} />
        <RangeRow label="채도 Chroma" value={state.chroma} display={state.chroma.toFixed(3)} min={0} max={0.3} step={0.002} onChange={(v) => set('chroma', v)} />
        <RangeRow label="명도 Lightness" value={state.lightness} display={`${(state.lightness * 100).toFixed(0)}%`} min={0.4} max={0.85} step={0.005} onChange={(v) => set('lightness', v)} />
      </div>

      <div className="lab-group">
        <span className="lab-group-label">팔레트 전개</span>
        <SelectRow
          label="액센트 전략 (색채 조화)"
          value={state.accentStrategy}
          options={[
            ['analogous', '유사색 (+35°)'],
            ['complementary', '보색 (+180°)'],
            ['split', '분열 보색 (+150°)'],
            ['triadic', '삼각 배색 (+120°)'],
            ['mono', '단색 (명도 변주)'],
          ]}
          onChange={(v) => set('accentStrategy', v)}
        />
        <SelectRow
          label="뉴트럴 온도"
          value={state.neutral}
          options={[
            ['pure', '순수 그레이'],
            ['warm', '따뜻한 그레이'],
            ['cool', '차가운 그레이'],
            ['tinted', '브랜드 틴트 그레이'],
          ]}
          onChange={(v) => set('neutral', v)}
        />
        <RangeRow label="상태색 생동감 Vibrance" value={state.vibrance} display={`×${state.vibrance.toFixed(2)}`} min={0.6} max={1.4} step={0.05} onChange={(v) => set('vibrance', v)} />
      </div>

      <div className="lab-group">
        <span className="lab-group-label">퍼스널리티 (분위기)</span>
        <SelectRow
          label="무드 프리셋"
          value={state.mood}
          options={[
            ['minimal', 'Minimal — 절제된 SaaS'],
            ['friendly', 'Friendly — 발랄한 컨슈머'],
            ['elegant', 'Elegant — 럭셔리 에디토리얼'],
            ['technical', 'Technical — 개발자 도구'],
            ['bold', 'Bold — 브루탈리스트'],
            ['tranquil', 'Tranquil — 차분한 웰니스'],
          ]}
          onChange={applyMood}
        />
        <div className="lab-grid-2">
          <SelectRow
            label="모서리"
            value={state.radius}
            options={[
              ['sharp', '각짐'],
              ['subtle', '은은함'],
              ['rounded', '둥글'],
              ['pill', '알약'],
            ]}
            onChange={(v) => set('radius', v)}
          />
          <SelectRow
            label="밀도"
            value={state.density}
            options={[
              ['compact', '컴팩트'],
              ['comfortable', '보통'],
              ['spacious', '여유'],
            ]}
            onChange={(v) => set('density', v)}
          />
          <SelectRow
            label="대비"
            value={state.contrast}
            options={[
              ['soft', '부드럽게'],
              ['standard', '표준'],
              ['high', '높게'],
            ]}
            onChange={(v) => set('contrast', v)}
          />
          <SelectRow
            label="깊이(그림자)"
            value={state.depth}
            options={[
              ['flat', '평면'],
              ['subtle', '은은함'],
              ['elevated', '입체'],
              ['dramatic', '드라마틱'],
            ]}
            onChange={(v) => set('depth', v)}
          />
          <SelectRow
            label="에너지(모션)"
            value={state.energy}
            options={[
              ['calm', '차분'],
              ['balanced', '균형'],
              ['lively', '활발'],
            ]}
            onChange={(v) => set('energy', v)}
          />
          <SelectRow
            label="보더 두께"
            value={String(state.borderWidth) as '1' | '1.5' | '2'}
            options={[
              ['1', '1px'],
              ['1.5', '1.5px'],
              ['2', '2px'],
            ]}
            onChange={(v) => set('borderWidth', Number(v))}
          />
        </div>
        <RangeRow label="타입 스케일 비율" value={state.typeRatio} display={`×${state.typeRatio.toFixed(3)}`} min={1.12} max={1.4} step={0.001} onChange={(v) => set('typeRatio', v)} />
      </div>

      <div className="lab-group">
        <span className="lab-group-label">타이포그래피</span>
        <div className="lab-grid-2">
          <SelectRow
            label="제목 폰트"
            value={state.headingFont}
            options={(Object.keys(FONT_STACKS) as FontStackName[]).map((k) => [k, k])}
            onChange={(v) => set('headingFont', v)}
          />
          <SelectRow
            label="본문 폰트"
            value={state.bodyFont}
            options={(Object.keys(FONT_STACKS) as FontStackName[]).map((k) => [k, k])}
            onChange={(v) => set('bodyFont', v)}
          />
        </div>
      </div>

      <div className="lab-group">
        <span className="lab-group-label">접근성 자동 검증 (라이트 모드)</span>
        <div className="audit-chips">
          <Badge tone={auditGray.textHigh >= 7 ? 'success' : 'warning'} variant="soft">
            본문 {auditGray.textHigh.toFixed(1)}:1
          </Badge>
          <Badge tone={auditGray.text >= 4.5 ? 'success' : 'warning'} variant="soft">
            보조 {auditGray.text.toFixed(1)}:1
          </Badge>
          <Badge tone={audit.onSolid >= 4.5 ? 'success' : 'warning'} variant="soft">
            솔리드 위 {audit.onSolid.toFixed(1)}:1
          </Badge>
          <Badge tone={audit.text >= 4.5 ? 'success' : 'warning'} variant="soft">
            브랜드 텍스트 {audit.text.toFixed(1)}:1
          </Badge>
        </div>
      </div>

      <div className="lab-group">
        <span className="lab-group-label">내보내기</span>
        <div className="row">
          <Button size="sm" onClick={copyCss} tone={copied ? 'success' : 'brand'}>
            {copied ? '✓ 복사됨' : 'CSS 복사'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadFile('theme.css', exportStandaloneCss(theme), 'text/css')}
          >
            theme.css
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              downloadFile('tokens.json', JSON.stringify(exportTokensJson(theme), null, 2), 'application/json')
            }
          >
            tokens.json
          </Button>
        </div>
        <p className="tf-hint">
          CSS는 <code>:root</code> 스코프 — 어떤 프레임워크든 그대로 붙여넣으면 됩니다.
        </p>
      </div>
    </aside>
  )
}
