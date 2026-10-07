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
          프로젝트 기획서를 바탕으로 AI가 추천한 채널 구성을 확인하고, 생성할 채널을 선택하세요.
        </p>
      </div>
      <div class="marketing-list-header__actions">
        <UiButton
          variant="primary"
          size="md"
          :disabled="!selectedCount || isGeneratingChannelBatch"
          @click="onStartGenerate"
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

    <UiEmpty
      v-if="!channelPicks.length"
      icon="icon-edit"
      title="선택할 수 있는 채널이 없습니다."
    />
    <div
      v-if="recommendedPicks.length"
      class="marketing-channel-select__recommend"
    >
      <h2>AI 추천 구성</h2>
      <table>
        <thead>
          <tr>
            <th>채널</th>
            <th>추천 콘텐츠</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="pick in recommendedPicks"
            :key="pick.channelCd"
          >
            <td>{{ pick.channelNm }}</td>
            <td>{{ pick.formatOptions.join(' · ') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="channelPicks.length"
      class="marketing-channel-select__strategy"
    >
      <h2>AI 채널별 이미지 전략</h2>
      <p>
        프로젝트 기획서의 공통 비주얼 방향을 그대로 복제하지 않고, 각 채널에서 이미지가 수행해야 할 역할을 기준으로
        생성합니다.
      </p>
      <table>
        <thead>
          <tr>
            <th>채널</th>
            <th>AI 생성 전략</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="pick in channelPicks"
            :key="`strategy-${pick.channelCd}`"
          >
            <td>{{ pick.channelNm }}</td>
            <td>{{ pick.imageStrategy }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="channelPicks.length"
      class="marketing-channel-select__grid"
    >
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
            <strong>
              {{ pick.channelNm }}
              <em v-if="pick.recommended">AI 추천</em>
            </strong>
            <span>{{ pick.formatOptions.join(' · ') }}</span>
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
          <UiToggle
            :model-value="pick.withImageYn === 'Y'"
            @click.stop
            @update:model-value="(isOn) => handleToggleWithImage(pick.channelCd, isOn)"
          />
        </div>
      </div>
    </div>

    <p
      v-if="channelPicks.length"
      class="marketing-channel-select__count"
    >
      선택됨: {{ selectedCount }}개 채널 · 선택한 채널은 별도 설정 단계 없이 채널 특성에 맞게 생성합니다
    </p>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiEmpty, UiIcon, UiToggle } from '@leechanyong/ispark-ui'
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

const onStartGenerate = async () => {
  if (!selectedCount.value || isGeneratingChannelBatch.value) return
  await handleGenerateChannelBatch()
}
</script>
