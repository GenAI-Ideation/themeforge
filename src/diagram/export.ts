/**
 * 다이어그램 SVG 내보내기.
 *
 * 라이브 SVG는 CSS 변수(테마 토큰)에 의존하므로 그대로 저장하면 무색이 된다.
 * 해법: getComputedStyle 로 "지금 화면에 보이는 값"을 읽어 presentation
 * 속성으로 구워 넣는다 → 테마가 박제된 standalone SVG. 문서/위키에 바로 사용.
 */

const PAINT_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linejoin',
  'stroke-linecap',
  'opacity',
  'paint-order',
  'font-family',
  'font-size',
  'font-weight',
  'letter-spacing',
  'dominant-baseline',
] as const

const TEXTUAL = new Set(['text', 'tspan'])

export function svgToStandalone(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  const src: Element[] = [svg, ...Array.from(svg.querySelectorAll('*'))]
  const dst: Element[] = [clone, ...Array.from(clone.querySelectorAll('*'))]

  src.forEach((el, i) => {
    const target = dst[i]
    if (!target) return
    const cs = getComputedStyle(el)
    for (const prop of PAINT_PROPS) {
      // 폰트 속성은 텍스트 요소에만 — 파일 크기 절약
      if (prop.startsWith('font') && !TEXTUAL.has(el.tagName)) continue
      const value = cs.getPropertyValue(prop)
      if (value && value !== 'normal' && value !== 'auto') target.setAttribute(prop, value)
    }
  })

  // 배경(테마의 표면색)을 깔아 다크 테마도 온전히 내보낸다
  const bg = getComputedStyle(svg).backgroundColor
  if (bg && bg !== 'rgba(0, 0, 0, 0)') {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('width', '100%')
    rect.setAttribute('height', '100%')
    rect.setAttribute('fill', bg)
    clone.insertBefore(rect, clone.firstChild)
  }

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const viewBox = svg.viewBox.baseVal
  if (viewBox && viewBox.width > 0) {
    clone.setAttribute('width', String(viewBox.width))
    clone.setAttribute('height', String(viewBox.height))
  }
  clone.removeAttribute('class')

  return new XMLSerializer().serializeToString(clone)
}

export function downloadSvg(svg: SVGSVGElement, filename: string): void {
  const text = svgToStandalone(svg)
  const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`
  a.click()
  URL.revokeObjectURL(url)
}
