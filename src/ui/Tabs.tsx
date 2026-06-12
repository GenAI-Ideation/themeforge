import type { HTMLAttributes, ReactNode } from 'react'
import { createContext, useContext, useId, useState } from 'react'
import { cx } from './shared'
import type { Tone } from './shared'

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs(component: string): TabsContextValue {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error(`<${component}>는 <Tabs> 안에서만 사용할 수 있습니다`)
  return ctx
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  children: ReactNode
}

export function Tabs({ defaultValue, children, ...rest }: TabsProps) {
  const [value, setValue] = useState(defaultValue)
  const baseId = useId()
  return (
    <TabsContext.Provider value={{ value, setValue, baseId }}>
      <div {...rest}>{children}</div>
    </TabsContext.Provider>
  )
}

export interface TabListProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'pills' | (string & {})
  tone?: Tone
}

export function TabList({ variant = 'line', tone = 'brand', className, ...rest }: TabListProps) {
  return (
    <div
      role="tablist"
      className={cx('tf-tablist', className)}
      data-variant={variant}
      data-tone={tone}
      {...rest}
    />
  )
}

export interface TabProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
}

export function Tab({ value, className, ...rest }: TabProps) {
  const ctx = useTabs('Tab')
  const selected = ctx.value === value
  return (
    <button
      type="button"
      role="tab"
      id={`${ctx.baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      className={cx('tf-tab', className)}
      onClick={() => ctx.setValue(value)}
      {...rest}
    />
  )
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabPanel({ value, className, ...rest }: TabPanelProps) {
  const ctx = useTabs('TabPanel')
  if (ctx.value !== value) return null
  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-panel-${value}`}
      aria-labelledby={`${ctx.baseId}-tab-${value}`}
      className={cx('tf-tabpanel', className)}
      {...rest}
    />
  )
}
