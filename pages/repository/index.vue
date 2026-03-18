<template>
  <div class="repository-index">
    <!-- 탭 -->
    <UiTab
      v-model="activeTab"
      :tabs="tabItems"
    />

    <!-- 메인: 탭별 컨텐츠 연결 -->
    <div class="repository-main l-center">
      <RepositoryDocumentPage
        v-if="activeTab === 'document'"
        key="document"
      />
      <RepositoryUrlPage
        v-else-if="activeTab === 'url'"
        key="url"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import RepositoryDocumentPage from '~/components/repository/RepositoryDocumentPage.vue'
import RepositoryUrlPage from '~/components/repository/RepositoryUrlPage.vue'

definePageMeta({ layout: 'default' })

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const activeTab = ref('document')
const tabItems = [
  { label: '문서 관리', value: 'document' },
  { label: 'URL 관리', value: 'url' },
]
</script>
