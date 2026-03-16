<template>
  <div class="prompt-version">
    <div class="prompt-box">
      <!-- 헤더 -->
      <div class="prompt-box-header">
        <div class="prompt-box-title">
          <span class="prompt-box-name">프롬프트 버전 관리</span>
          <span class="prompt-box-sub">프롬프트 변경 이력을 확인하고 이전 버전으로 복원할 수 있습니다.</span>
        </div>
      </div>

      <!-- 현재 버전 -->
      <PromptVersionCurrent
        :current="currentVersion"
        @detail="onDetail"
      />

      <!-- 변경 이력 타이틀 -->
      <div class="prompt-version-history-title">변경 이력</div>

      <!-- 통계 -->
      <PromptVersionStats :stats="versionStats" />

      <!-- 타임라인 -->
      <div class="prompt-timeline">
        <div
          v-for="(item, index) in versionList"
          :key="item.id"
          class="prompt-timeline-row"
        >
          <!-- 좌측: 날짜 + 점 -->
          <div class="prompt-timeline-left-item">
            <div class="prompt-timeline-left-info">
              <span class="prompt-timeline-date">{{ item.createdAt }}</span>
              <span class="prompt-timeline-author">{{ item.author }}</span>
            </div>
            <div class="prompt-timeline-dot">
              <span
                class="prompt-timeline-dot-circle"
                :class="{ 'is-active': index === 0 }"
              />
            </div>
          </div>

          <!-- 우측: 카드 -->
          <PromptVersionTimelineItem
            :version="item"
            @restore="onRestore"
            @compare="onCompare"
          />
        </div>
      </div>
    </div>

    <!-- 복원 확인 모달 -->
    <UiDialogModal
      :is-open="isRestoreModalOpen"
      title="버전 복원"
      :message="`버전 ${restoringVersion?.version}으로 복원하시겠습니까?`"
      confirm-text="복원"
      @close="isRestoreModalOpen = false"
      @confirm="doRestore"
    />
  </div>
</template>

<script setup lang="ts">
import type { PromptVersion } from '~/types/prompt'
import { usePromptStore } from '~/composables/prompt/usePromptStore'

const { versionList, versionStats, handleSelectVersionList, handleRestoreVersion } = usePromptStore()

// 초기 조회
onMounted(() => handleSelectVersionList())

// 현재 활성 버전
const currentVersion = computed(() => versionList.value.find((v) => v.status === 'active') ?? null)

// 상세 보기
const onDetail = (version: PromptVersion) => {
  console.warn('[TODO] 버전 상세 보기', version)
}

// 비교
const onCompare = (version: PromptVersion) => {
  console.warn('[TODO] 버전 비교', version)
}

// 복원
const isRestoreModalOpen = ref(false)
const restoringVersion = ref<PromptVersion | null>(null)

const onRestore = (version: PromptVersion) => {
  restoringVersion.value = version
  isRestoreModalOpen.value = true
}

const doRestore = async () => {
  if (!restoringVersion.value) return
  await handleRestoreVersion(restoringVersion.value.id)
  isRestoreModalOpen.value = false
  restoringVersion.value = null
}
</script>
