/**
 * 멀티 테마 스트립 — "같은 컴포넌트, 다른 디자인 시스템"의 결정적 증거.
 * 각 패널은 data-theme 속성 하나로 자기만의 시스템을 입는다.
 * (토큰이 서브트리 스코프라서 한 화면에 여러 시스템이 공존할 수 있다)
 */

import type { Mode } from '../core'
import { PRESETS } from '../themes/presets'
import { Avatar, Badge, Button, Progress, Switch } from '../ui'

export function MultiThemeStrip({ mode }: { mode: Mode }) {
  return (
    <div className="mt-strip">
      {PRESETS.map((preset) => (
        <div key={preset.name} data-theme={preset.name} data-mode={mode} className="mt-panel">
          <div className="mt-panel-head">
            <span>{preset.label}</span>
            <Badge tone="brand" variant="soft" dot>
              live
            </Badge>
          </div>
          <p className="mt-desc">{preset.description}</p>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <Avatar name={preset.label ?? preset.name} size="sm" />
            <Progress value={68} style={{ flex: 1 }} />
          </div>
          <div className="row">
            <Button size="sm">시작하기</Button>
            <Button size="sm" variant="outline" tone="neutral">
              문서
            </Button>
          </div>
          <Switch defaultChecked label="알림 받기" />
        </div>
      ))}
    </div>
  )
}
