// ispark-ui 라이브러리 컴포넌트 글로벌 등록
// 마이그레이션 정책: 라이브러리화된 컴포넌트는 여기서 등록하고
// components/ui/Ui*.vue 로컬 파일은 제거한다. 사용처(.vue 파일)는
// 변경 없이 <UiButton>, <UiTable> 등을 그대로 사용 가능.
import { UiTable } from '@leechanyong/ispark-ui'

export default defineNuxtPlugin((nuxtApp) => {
  // 1차 시범: UiTable (사용처 7개)
  nuxtApp.vueApp.component('UiTable', UiTable)
})
