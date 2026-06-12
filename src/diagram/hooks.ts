import { useId } from 'react'

/** useId 를 url(#...) 참조에 안전한 형태로 — SVG marker id 용 */
export function useSvgUid(): string {
  return `tf${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
}
