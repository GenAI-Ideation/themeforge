/**
 * 컴포넌트 공통 타입과 합성 도우미.
 *
 * Tone/Variant/Size 에 `(string & {})` 를 합집합해 둔 이유:
 * 자동완성은 기본값을 제안하되, CSS만 추가하면 임의의 커스텀 값
 * (`variant="glow"` 같은)도 타입 에러 없이 통과시키기 위함이다.
 * → "확장에 열려 있고 수정에 닫혀 있는" 변형 시스템.
 */

import { cloneElement, isValidElement } from 'react'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export type Tone =
  | 'neutral'
  | 'brand'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | (string & {})

export type Variant = 'solid' | 'soft' | 'outline' | 'ghost' | (string & {})
export type Size = 'sm' | 'md' | 'lg' | (string & {})

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * asChild 패턴: 컴포넌트의 스타일/동작을 자식 엘리먼트에 "입힌다".
 * <Button asChild><a href="...">링크</a></Button> → 버튼처럼 보이는 <a>.
 * 마크업까지 바꿔치기할 수 있는 가장 가벼운 합성 장치.
 */
export function Slot({
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { children?: ReactNode }) {
  if (!isValidElement(children)) return null
  const child = children as React.ReactElement<Record<string, unknown>>
  const childProps = child.props
  return cloneElement(child, {
    ...props,
    ...childProps,
    className: cx(
      (props as { className?: string }).className,
      childProps.className as string | undefined,
    ),
    style: {
      ...(props as { style?: CSSProperties }).style,
      ...(childProps.style as CSSProperties | undefined),
    },
  })
}
