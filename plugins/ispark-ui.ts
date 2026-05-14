// ispark-ui 라이브러리 컴포넌트 글로벌 등록
// 마이그레이션 정책: 라이브러리화된 컴포넌트는 여기서 등록하고
// components/ui/Ui*.vue 로컬 파일은 제거한다. 사용처(.vue 파일)는
// 변경 없이 <UiButton>, <UiTable> 등을 그대로 사용 가능.
//
// 마이그레이션 보류:
// - UiButton: 사용처에서 라이브러리에 없는 variant(outline/line-secondary 등) 광범위 사용
// - UiBadge: 사용처에서 도메인 특화 variant(data-line/manual-ai 등) 사용
// → 라이브러리 variant 확장 또는 사용처 일괄 매핑 후 별도 PR
import {
  UiButton,
  UiTable,
  UiInput,
  UiSelect,
  UiModal,
  UiTextarea,
  UiEmpty,
  UiToggle,
  UiLoading,
  UiCheckbox,
  UiBadge,
} from '@leechanyong/ispark-ui'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('UiButton', UiButton)
  nuxtApp.vueApp.component('UiTable', UiTable)
  nuxtApp.vueApp.component('UiInput', UiInput)
  nuxtApp.vueApp.component('UiSelect', UiSelect)
  nuxtApp.vueApp.component('UiModal', UiModal)
  nuxtApp.vueApp.component('UiTextarea', UiTextarea)
  nuxtApp.vueApp.component('UiEmpty', UiEmpty)
  nuxtApp.vueApp.component('UiToggle', UiToggle)
  nuxtApp.vueApp.component('UiLoading', UiLoading)
  nuxtApp.vueApp.component('UiCheckbox', UiCheckbox)
  nuxtApp.vueApp.component('UiBadge', UiBadge)
})
