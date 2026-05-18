<template>
  <div class="meeting2-stt-section">
    <!-- 검색 바 -->
    <div
      v-if="isSearchOpen"
      class="meeting2-stt-search-bar"
    >
      <div class="meeting2-stt-search-select-wrap">
        <select
          v-model="searchType"
          class="meeting2-stt-search-select"
        >
          <option value="내용">내용</option>
          <option value="화자">화자</option>
        </select>
      </div>
      <div class="meeting2-stt-search-input-wrap">
        <input
          v-model="searchKeyword"
          class="meeting2-stt-search-input"
          :placeholder="searchType === '화자' ? '화자 이름 검색' : '내용 검색'"
          @focus="onSearchInputFocus"
          @blur="onSearchInputBlur"
          @input="onSearchInput"
        />
        <div
          v-show="isSearchSuggestOpen && searchType === '화자'"
          class="meeting2-stt-search-suggest"
        >
          <button
            v-for="speaker in filteredSpeakerSuggests"
            :key="speaker.id"
            type="button"
            class="meeting2-stt-search-suggest-item"
            @mousedown.prevent="onPickSpeakerSuggest(speaker.name)"
          >
            {{ speaker.name }}
          </button>
          <UiEmpty
            v-if="filteredSpeakerSuggests.length === 0"
            title="검색 결과가 없습니다."
          />
        </div>
      </div>
    </div>

    <UiEmpty
      v-if="filteredSttList.length === 0"
      :title="isSearchOpen && searchKeyword.trim() ? '검색 결과가 없습니다.' : '아직 발화 내용이 없습니다.'"
      :description="isSearchOpen && searchKeyword.trim() ? undefined : '녹음을 시작하면 실시간 STT가 표시됩니다.'"
    />

    <div
      v-else
      class="meeting2-stt-list"
    >
      <div
        v-for="item in filteredSttList"
        :id="`stt-item-${item.id}`"
        :key="item.id"
        class="meeting2-stt-item"
        :class="{ 'is-focused': focusedSttItemId === item.id }"
      >
        <span
          class="meeting2-stt-item-avatar"
          :class="`meeting2-speaker-color-${getSpeakerColor(item.speakerId)}`"
        >
          {{ getSpeakerAvatar(item.speakerId, item.speakerName) }}
        </span>
        <div class="meeting2-stt-item-body">
          <div class="meeting2-stt-item-meta">
            <span class="meeting2-stt-item-name">{{ item.speakerName }}</span>
            <span class="meeting2-stt-item-time">{{ item.time }}</span>
          </div>
          <p class="meeting2-stt-item-text">{{ item.text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import { computeSpeakerAvatarMap } from '~/utils/meeting/speakerAvatarUtil'

const { currentMeeting, focusedSttItemId, isSearchOpen, searchType, searchKeyword, filteredSttList } = useMeetingStore()

const speakers = computed(() => currentMeeting.value?.speakers ?? [])
const avatarMap = computed(() => computeSpeakerAvatarMap(speakers.value))

const getSpeakerColor = (speakerId: string) => {
  const speaker = speakers.value.find((s) => s.id === speakerId)
  return speaker?.colorIndex ?? 0
}

const getSpeakerAvatar = (speakerId: string, speakerName: string) => {
  return avatarMap.value.get(speakerId) || speakerName?.charAt(0) || '?'
}

// 화자 자동완성
const isSearchSuggestOpen = ref(false)
let suggestBlurTimer: ReturnType<typeof setTimeout> | null = null

const filteredSpeakerSuggests = computed(() => {
  if (searchType.value !== '화자') return []
  const kw = searchKeyword.value.trim().toLowerCase()
  const list = speakers.value
  if (!kw) return list
  return list.filter((s) => s.name.toLowerCase().includes(kw))
})

const onSearchInputFocus = () => {
  if (suggestBlurTimer) {
    clearTimeout(suggestBlurTimer)
    suggestBlurTimer = null
  }
  isSearchSuggestOpen.value = true
}

const onSearchInputBlur = () => {
  suggestBlurTimer = window.setTimeout(() => {
    isSearchSuggestOpen.value = false
    suggestBlurTimer = null
  }, 180)
}

const onSearchInput = () => {
  isSearchSuggestOpen.value = true
}

const onPickSpeakerSuggest = (name: string) => {
  searchKeyword.value = name
  isSearchSuggestOpen.value = false
}

// searchType 변경 시 키워드 초기화
watch(searchType, () => {
  searchKeyword.value = ''
})

// isSearchOpen 닫힐 때 자동완성 닫기
watch(isSearchOpen, (open) => {
  if (!open) isSearchSuggestOpen.value = false
})

// focusedSttItemId 변경 시 해당 아이템으로 스크롤
watch(focusedSttItemId, async (id) => {
  if (!id) return
  await nextTick()
  document.getElementById(`stt-item-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
})
</script>
