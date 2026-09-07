<template>
  <div class="marketing-channel-select">
    <button
      class="marketing-back-btn"
      type="button"
      @click="popMarketingPhase()"
    >
      <UiIcon
        name="arrow-right"
        size="16"
        class="marketing-back-btn__arrow"
      />
      제작 내역
    </button>

    <div class="marketing-list-header">
      <div class="marketing-list-header__copy">
        <h1 class="marketing-list-title">채널 구성 확인</h1>
        <p class="marketing-list-desc">
          캠페인 기획서를 바탕으로 AI가 추천한 채널 구성을 확인하고, 생성할 채널을 선택하세요.
        </p>
      </div>
    </div>

    <div
      v-if="recommendedPicks.length"
      class="marketing-channel-select__recommend"
    >
      <h2>AI 추천 구성</h2>
      <table>
        <thead>
          <tr>
            <th>채널</th>
            <th>형식</th>
            <th>이미지 전략</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="pick in recommendedPicks"
            :key="pick.channelCd"
          >
            <td>{{ pick.channelNm }}</td>
            <td>{{ pick.formatOptions.join(', ') }}</td>
            <td>{{ pick.imageStrategy }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="marketing-channel-select__grid">
      <div
        v-for="pick in channelPicks"
        :key="pick.channelCd"
        class="marketing-channel-select__card"
        :class="{ 'is-selected': pick.selected }"
      >
        <div
          class="marketing-channel-select__card-top"
          @click="handleTogglePick(pick.channelCd)"
        >
          <div class="marketing-channel-select__card-icon">{{ pick.channelNm.slice(0, 2) }}</div>
          <div>
            <strong>{{ pick.channelNm }}</strong>
            <span v-if="pick.recommended">AI 추천</span>
          </div>
          <span class="marketing-channel-select__card-check">
            <UiIcon
              v-if="pick.selected"
              name="check"
              size="12"
            />
          </span>
        </div>
        <div class="marketing-channel-select__card-image-row">
          <span>이미지 함께 생성</span>
          <button
            type="button"
            class="marketing-channel-select__image-toggle"
            :class="{ 'is-on': pick.withImageYn === 'Y' }"
            @click.stop="handleToggleWithImage(pick.channelCd)"
          />
        </div>
      </div>
    </div>

    <div class="marketing-channel-select__footer">
      <span>{{ selectedCount }}개 채널 선택됨</span>
      <UiButton
        variant="primary"
        size="md"
        :disabled="!selectedCount || isGeneratingChannelBatch"
        @click="handleGenerateChannelBatch"
      >
        멀티채널 콘텐츠 생성 시작
        <template #icon-right>
          <UiIcon
            name="arrow-right"
            size="16"
          />
        </template>
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'

const {
  channelPicks,
  isGeneratingChannelBatch,
  handleTogglePick,
  handleToggleWithImage,
  handleGenerateChannelBatch,
  popMarketingPhase,
} = useMarketingStore()

const recommendedPicks = computed(() => channelPicks.value.filter((pick) => pick.recommended))
const selectedCount = computed(() => channelPicks.value.filter((pick) => pick.selected).length)
</script>
