<template>
  <div class="prompt-page">
    <div class="prompt-page-header">
      <UiTab
        v-model="activeTab"
        :tabs="tabs"
      />
    </div>

    <div class="prompt-page-body m-center">
      <!-- 시스템 프롬프트 -->
      <PromptSystem v-if="activeTab === 'system'" />

      <!-- 템플릿 -->
      <PromptTemplate v-else-if="activeTab === 'template'" />

      <!-- 추후 탭 -->
      <div v-else style="padding: 24px; color: #94a3b8;">
        {{ activeTabLabel }} 탭은 준비 중입니다.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const activeTab = ref('system')

const tabs = [
  { label: '시스템 프롬프트', value: 'system' },
  { label: '템플릿', value: 'template' },
  { label: '금지어/필터링', value: 'filter' },
  { label: '토큰/응답 제한', value: 'limit' },
  { label: '버전 관리', value: 'version' },
]

const activeTabLabel = computed(() => tabs.find((t) => t.value === activeTab.value)?.label ?? '')
</script>
