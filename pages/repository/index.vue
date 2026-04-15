<template>
  <div class="repository-index">
    <!-- 탭 -->
    <UiTab
      v-model="activeTab"
      :tabs="tabItems"
    />

    <!-- 메인: 탭별 컨텐츠 연결 (v-show로 DOM 유지 — 탭 전환 시 깜박임 방지) -->
    <div class="repository-main l-center">
      <RepositoryFilePage v-show="activeTab === 'file'" />
    </div>
    <UiLoading
      v-if="isLoading"
      overlay
      text="불러오는 중..."
    />
  </div>
</template>

<script setup lang="ts">
import RepositoryFilePage from '~/components/repository/RepositoryFilePage.vue'
import { useRepositoryStore } from '~/composables/repository/useRepositoryStore'
const { isLoading } = useRepositoryStore()
definePageMeta({ layout: 'default' })

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const activeTab = ref('file')
const tabItems = [{ label: '파일 관리', value: 'file' }]
</script>
