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
      <strong>AI 추천 채널</strong>
      <span>{{ recommendedPicks.map((pick) => pick.channelNm).join(', ') }}</span>
    </div>

    <div
      v-if="channelPicks.length"
      class="marketing-channel-select__strategy"
    >
      <button
        type="button"
        class="marketing-channel-select__strategy-toggle"
        :aria-expanded="isStrategyOpen"
        @click="isStrategyOpen = !isStrategyOpen"
      >
        <h2>AI 채널별 이미지 전략</h2>
        <UiIcon
          name="chevron-down"
          size="16"
          :class="{ 'is-open': isStrategyOpen }"
        />
      </button>
      <template v-if="isStrategyOpen">
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
      </template>
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

    <UiModal
      :is-open="conflicts.length > 0"
      position="center"
      max-width="480px"
      title="기존 콘텐츠 덮어쓰기"
      custom-class="marketing-overwrite-modal"
      @close="onCloseOverwrite"
    >
      <p class="marketing-overwrite-modal__desc">
        {{ conflictChannelNames }}에는 기존 발행물이 있습니다. 해당 내용을 덮어씌우시겠습니까?
      </p>
      <ul class="marketing-overwrite-modal__list">
        <li
          v-for="item in conflicts"
          :key="item.channelCd"
        >
          <strong>{{ item.channelNm }}</strong>
          <span v-if="item.isLocked">승인 진행 중·승인 완료·예약·발행완료 콘텐츠라 덮어쓸 수 없습니다</span>
          <UiSelect
            v-else
            v-model="overwriteChoices[item.channelCd]"
            :options="OVERWRITE_OPTIONS"
            size="sm"
          />
        </li>
      </ul>
      <p class="marketing-form-hint">덮어쓰면 기존 시안과 검수·승인 내역이 삭제되고 새로 생성합니다.</p>
      <template #footer>
        <div class="modal-dialog-footer">
          <UiButton
            class="btn-modal-dialog"
            variant="outline"
            size="xlg"
            @click="onCloseOverwrite"
          >
            취소
          </UiButton>
          <UiButton
            class="btn-modal-dialog"
            variant="primary"
            size="xlg"
            @click="onConfirmOverwrite"
          >
            생성 시작
          </UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiEmpty, UiIcon, UiModal, UiSelect, UiToggle } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import type { MarketingChannelConflict } from '~/types/marketing'

const {
  channelPicks,
  isGeneratingChannelBatch,
  handleTogglePick,
  handleToggleWithImage,
  handleSelectChannelConflicts,
  handleGenerateChannelBatch,
  popMarketingPhase,
} = useMarketingStore()

const OVERWRITE_OPTIONS = [
  { label: '덮어쓰기', value: 'Y' },
  { label: '덮어쓰지 않음', value: 'N' },
]

/** 기존 콘텐츠가 있는 선택 채널 — 비어 있지 않으면 덮어쓰기 확인 모달을 띄운다 */
const conflicts = ref<MarketingChannelConflict[]>([])
const overwriteChoices = ref<Record<string, string>>({})

const conflictChannelNames = computed(() => conflicts.value.map((item) => `${item.channelNm} 채널`).join(', '))

/** 이미지 전략은 기본으로 접어 두고 눌렀을 때만 펼친다 */
const isStrategyOpen = ref(false)
const recommendedPicks = computed(() => channelPicks.value.filter((pick) => pick.recommended))
const selectedCount = computed(() => channelPicks.value.filter((pick) => pick.selected).length)

const onStartGenerate = async () => {
  if (!selectedCount.value || isGeneratingChannelBatch.value) return
  const found = await handleSelectChannelConflicts()
  if (!found.length) {
    await handleGenerateChannelBatch()
    return
  }
  overwriteChoices.value = Object.fromEntries(
    found.filter((item) => !item.isLocked).map((item) => [item.channelCd, 'Y']),
  )
  conflicts.value = found
}

const onCloseOverwrite = () => {
  conflicts.value = []
}

const onConfirmOverwrite = async () => {
  const found = conflicts.value
  const overwriteChannelCds = found
    .filter((item) => !item.isLocked && overwriteChoices.value[item.channelCd] === 'Y')
    .map((item) => item.channelCd)
  conflicts.value = []
  await handleGenerateChannelBatch(found, overwriteChannelCds)
}
</script>
