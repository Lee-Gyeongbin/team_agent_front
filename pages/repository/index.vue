<template>
  <div class="repository-index">
    <!-- 탭 -->
    <UiTab
      v-model="activeTab"
      :tabs="tabItems"
    />

    <!-- 메인: 탭별 컨텐츠 연결 (v-show로 DOM 유지 — 탭 전환 시 깜박임 방지) -->
    <div class="repository-main l-center">
      <!-- DOM 순상 메인 블록 뒤에 두면 풀뷰포트 높이 아래로 밀림 → 메인 안 오버레이로 덮음 -->
      <div
        v-if="isLoading"
        class="repository-loading-overlay"
      >
        <UiLoading
          overlay
          text="불러오는 중..."
        />
      </div>
      <RepositoryDocumentPage v-show="activeTab === 'document' && !isLoading" />
      <!-- <RepositoryUrlPage v-show="activeTab === 'url'" /> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import RepositoryDocumentPage from '~/components/repository/RepositoryDocumentPage.vue'
import RepositoryUrlPage from '~/components/repository/RepositoryUrlPage.vue'
import { useRepositoryStore } from '~/composables/repository/useRepositoryStore'
const { isLoading } = useRepositoryStore()
definePageMeta({ layout: 'default' })

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const activeTab = ref('document')
const tabItems = [
  { label: '문서 관리', value: 'document' },
  // { label: 'URL 관리', value: 'url' },
]
</script>
