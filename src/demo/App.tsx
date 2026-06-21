import { useEffect, useMemo, useState } from 'react'
import type { Mode } from '../core'
import { buildTheme, emitAllThemesCss, emitThemeCss } from '../core'
import { PRESETS } from '../themes/presets'
import { Badge, Button } from '../ui'
import { DiagramsSection } from './Diagrams'
import { Gallery } from './Gallery'
import { MultiThemeStrip } from './MultiTheme'
import { ResponsiveSection } from './Responsive'
import { DEFAULT_LAB, labToConfig, ThemeLab } from './ThemeLab'
import type { LabState } from './ThemeLab'

// 프리셋은 정적이므로 모듈 로드 시 한 번만 빌드
const BUILT_PRESETS = PRESETS.map(buildTheme)
const PRESET_CSS = emitAllThemesCss(BUILT_PRESETS)

function injectCss(id: string, css: string) {
  let el = document.getElementById(id) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }
  if (el.textContent !== css) el.textContent = css
}

export default function App() {
  const [themeName, setThemeName] = useState('aurora')
  const [mode, setMode] = useState<Mode>(() =>
    document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light',
  )
  const [labOpen, setLabOpen] = useState(false)
  const [lab, setLab] = useState<LabState>(DEFAULT_LAB)

  // 커스텀 테마: 랩 상태가 바뀔 때마다 다시 찍어낸다 (수 ms — 실시간으로 충분)
  const customTheme = useMemo(() => buildTheme(labToConfig(lab)), [lab])

  useEffect(() => {
    injectCss('tf-preset-themes', PRESET_CSS)
  }, [])

  useEffect(() => {
    injectCss('tf-custom-theme', emitThemeCss(customTheme))
  }, [customTheme])

  useEffect(() => {
    document.documentElement.dataset.theme = themeName
    document.documentElement.dataset.mode = mode
    try {
      localStorage.setItem('tf-mode', mode)
    } catch {
      /* 사생활 모드 등 */
    }
  }, [themeName, mode])

  const activeTheme =
    themeName === 'custom'
      ? customTheme
      : (BUILT_PRESETS.find((t) => t.config.name === themeName) ?? BUILT_PRESETS[0])

  const openLab = () => {
    setLabOpen(true)
    setThemeName('custom')
  }

  return (
    <>
      <header className="app-header">
        <span className="app-logo">
          Theme<span>Forge</span> ⚒
        </span>
        <nav className="theme-switcher" aria-label="테마 선택">
          {PRESETS.map((p) => (
            <Button
              key={p.name}
              size="sm"
              variant={themeName === p.name ? 'soft' : 'ghost'}
              tone={themeName === p.name ? 'brand' : 'neutral'}
              onClick={() => setThemeName(p.name)}
            >
              {p.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={themeName === 'custom' ? 'soft' : 'ghost'}
            tone={themeName === 'custom' ? 'accent' : 'neutral'}
            onClick={openLab}
          >
            🧪 Custom
          </Button>
        </nav>
        <span className="app-header-spacer" />
        <Button
          size="sm"
          iconOnly
          variant="ghost"
          tone="neutral"
          aria-label={mode === 'light' ? '다크 모드로' : '라이트 모드로'}
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
        >
          {mode === 'light' ? '☾' : '☀'}
        </Button>
        <Button size="sm" variant={labOpen ? 'soft' : 'solid'} onClick={() => (labOpen ? setLabOpen(false) : openLab())}>
          {labOpen ? '랩 닫기' : '테마 랩'}
        </Button>
      </header>

      <main className="app-main" data-lab-open={labOpen ? '' : undefined}>
        <section className="hero">
          <Badge tone="brand" variant="soft" dot>
            디자인 시스템 팩토리 · v0.1
          </Badge>
          <h1>
            하나의 템플릿으로 <em>무한한</em> 디자인 시스템을
          </h1>
          <p className="hero-sub">
            시드 색 하나와 퍼스널리티 파라미터 몇 개가 84색 팔레트, 타입 스케일, 간격, 모서리,
            그림자, 모션까지 전부 결정합니다. 컴포넌트는 시맨틱 토큰만 읽기 때문에 — 테마를 갈아끼우면
            제품 전체가 다시 태어납니다.
          </p>
          <div className="row">
            <Button size="lg" onClick={openLab}>
              테마 랩에서 직접 찍어내기
            </Button>
            <Button size="lg" variant="outline" tone="neutral" asChild>
              <a href="#colors">토큰 구경하기</a>
            </Button>
          </div>
          <p className="hero-quote">
            지금 보는 테마: <strong>{activeTheme.config.label}</strong> —{' '}
            {activeTheme.config.description}
          </p>
        </section>

        <section className="section" id="multi">
          <span className="section-label">Proof</span>
          <h2 className="section-title">같은 컴포넌트, 여섯 개의 시스템</h2>
          <p className="section-desc">
            아래 카드들은 전부 동일한 React 컴포넌트입니다. 패널마다 <code>data-theme</code> 속성
            하나만 다릅니다 — 토큰이 서브트리에 스코프되기 때문에 한 화면에 여러 시스템이 공존합니다.
          </p>
          <MultiThemeStrip mode={mode} />
        </section>

        <Gallery theme={activeTheme} mode={mode} />

        <ResponsiveSection />

        <DiagramsSection />
      </main>

      <footer className="app-footer">
        ThemeForge — 디자인 시스템을 찍어내는 디자인 시스템 템플릿. 토큰 엔진은{' '}
        <code>src/core</code>, 컴포넌트는 <code>src/ui</code>, 여러분의 다음 시스템은{' '}
        <code>src/themes</code>에.
      </footer>

      {labOpen && (
        <ThemeLab
          state={lab}
          theme={customTheme}
          onChange={(next) => {
            setLab(next)
            if (themeName !== 'custom') setThemeName('custom')
          }}
          onClose={() => setLabOpen(false)}
        />
      )}
    </>
  )
}
