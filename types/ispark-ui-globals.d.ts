// ispark-ui 컴포넌트가 plugin 글로벌 등록되어 사용처 .vue 파일에서
// <UiTable> 등으로 직접 사용할 수 있도록 GlobalComponents 인터페이스에 선언.
// 런타임 등록은 plugins/ispark-ui.ts에서, 타입은 여기에서.
import type {
  UiTable,
} from '@leechanyong/ispark-ui'

declare module 'vue' {
  interface GlobalComponents {
    UiTable: typeof UiTable
  }
}

export {}
