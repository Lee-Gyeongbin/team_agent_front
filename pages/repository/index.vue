<template>
  <div class="repository-index">
    <!-- 탭 -->
    <UiTab
      v-model="activeRepositoryTab"
      :tabs="tabItems"
    />

    <!-- 메인: 탭별 컨텐츠 연결 (v-show로 DOM 유지 — 탭 전환 시 깜박임 방지) -->
    <div class="repository-main l-center">
      <RepositoryFilePage v-show="activeRepositoryTab === 'file'" />
      <RepositoryUrlPage v-show="activeRepositoryTab === 'url'" />
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
const { isLoading, activeRepositoryTab } = useRepositoryStore()
definePageMeta({ layout: 'default' })

const tabItems = [
  { label: '파일 관리', value: 'file' },
  { label: 'URL 관리', value: 'url' },
]
</script>
