<template>
  <div class="repository-index">
    <!-- 탭 -->
    <UiTab
      v-model="activeTab"
      :tabs="tabItems"
    />

    <!-- 메인: 탭별 컨텐츠 연결 -->
    <div class="repository-main l-center">
      <DocumentTab
        v-if="activeTab === 'document'"
        key="document"
      />
      <UrlTab
        v-else-if="activeTab === 'url'"
        key="url"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import DocumentTab from '~/components/repository/DocumentTab.vue'
import UrlTab from '~/components/repository/UrlTab.vue'

definePageMeta({ layout: 'default' })

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const activeTab = ref('document')
const tabItems = [
  { label: '문서 관리', value: 'document' },
  { label: 'URL 관리', value: 'url' },
]
</script>
