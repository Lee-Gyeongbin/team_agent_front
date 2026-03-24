<template>
  <div class="prompt-page">
    <div class="prompt-page-header">
      <UiTab
        v-model="activeTab"
        :tabs="tabs"
      />
    </div>

    <div class="prompt-page-body s-center">
      <!-- 탭별 본문: key로 교체 시 AOS가 새 요소로 인식해 fade-up 재생 -->
      <div
        :key="activeTab"
        class="prompt-tab-panel"
        data-aos="fade-up"
      >
        <!-- 시스템 프롬프트 -->
        <PromptSystem v-if="activeTab === 'system'" />

        <!-- 템플릿 -->
        <!-- <PromptTemplate v-else-if="activeTab === 'template'" /> -->

        <!-- 금지어/필터링 -->
        <PromptFilter v-else-if="activeTab === 'filter'" />

        <!-- 토큰/응답 제한 -->
        <PromptLimit v-else-if="activeTab === 'limit'" />

        <!-- 버전 관리 -->
        <!-- <PromptVersion v-else-if="activeTab === 'version'" /> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AOS from 'aos'

const activeTab = ref('system')

const { handleSelectFilterData, handleSelectLimitData } = usePromptStore()

const refreshPromptPanelAos = () => {
  nextTick(() => {
    AOS.refresh()
  })
}

// 금지어 탭은 마운트 시 빈 목록 → API 후 태그/정책이 생기며 높이가 튀므로, 페이지 진입 시 미리 조회해 둠
onMounted(() => {
  handleSelectFilterData()
  handleSelectLimitData()
  refreshPromptPanelAos()
})

watch(activeTab, () => {
  refreshPromptPanelAos()
})

// TODO : 템플릿, 버전 탭 기획 완료 후 추가
const tabs = [
  { label: '시스템 프롬프트', value: 'system' },
  // { label: '템플릿', value: 'template' },
  { label: '금지어/필터링', value: 'filter' },
  { label: '토큰/응답 제한', value: 'limit' },
  // { label: '버전 관리', value: 'version' },
]
</script>
