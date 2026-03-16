<template>
  <div
    class="com-setting-section"
    :class="{ 'is-collapsed': isCollapsed }"
    style="--label-width: 120px"
  >
    <div
      class="com-setting-section-header"
      @click="isCollapsed = !isCollapsed"
    >
      <span class="com-setting-section-title">모델 파라미터</span>
      <span class="com-setting-section-arrow">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 10l4-4 4 4"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>

    <div class="com-setting-section-body">
      <!-- Temperature / Top P -->
      <div class="com-setting-row">
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">Temperature</label>
          <UiInput
            :model-value="modelValue.temperature"
            type="number"
            size="sm"
            @update:model-value="onUpdate('temperature', Number($event))"
          />
        </div>
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">Top P</label>
          <UiInput
            :model-value="modelValue.topP"
            type="number"
            size="sm"
            @update:model-value="onUpdate('topP', Number($event))"
          />
        </div>
      </div>

      <!-- Max Tokens / 컨텍스트 윈도우 -->
      <div class="com-setting-row">
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">Max Tokens</label>
          <UiInput
            :model-value="modelValue.maxTokens"
            type="number"
            size="sm"
            @update:model-value="onUpdate('maxTokens', Number($event))"
          />
        </div>
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">컨텍스트 윈도우</label>
          <UiInput
            :model-value="modelValue.ctxtWin"
            type="number"
            size="sm"
            @update:model-value="onUpdate('ctxtWin', Number($event))"
          />
        </div>
      </div>

      <!-- Frequency Penalty / Presence Penalty -->
      <div class="com-setting-row">
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">Frequency Penalty</label>
          <UiInput
            :model-value="modelValue.freqPenalty"
            type="number"
            size="sm"
            @update:model-value="onUpdate('freqPenalty', Number($event))"
          />
        </div>
        <div
          class="com-setting-field-row"
          style="flex: 1"
        >
          <label class="com-setting-label">Presence Penalty</label>
          <UiInput
            :model-value="modelValue.presPenalty"
            type="number"
            size="sm"
            @update:model-value="onUpdate('presPenalty', Number($event))"
          />
        </div>
      </div>

      <!-- 지원여부 체크박스 -->
      <div class="com-setting-field-row">
        <label class="com-setting-label">지원여부</label>
        <div class="com-setting-checkbox-group">
          <UiCheckbox
            :model-value="modelValue.streamYn === 'Y'"
            label="스트리밍"
            @update:model-value="onUpdate('streamYn', $event)"
          />
          <UiCheckbox
            :model-value="modelValue.fnCallYn === 'Y'"
            label="함수 호출 (Tool)"
            @update:model-value="onUpdate('fnCallYn', $event)"
          />
          <UiCheckbox
            :model-value="modelValue.visionYn === 'Y'"
            label="비전(이미지)"
            @update:model-value="onUpdate('visionYn', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** 모델 파라미터 폼 (modelId는 기본 정보에서 관리) */
interface ParamForm {
  temperature: number
  topP: number
  maxTokens: number
  ctxtWin: number
  freqPenalty: number
  presPenalty: number
  streamYn: 'Y' | 'N'
  fnCallYn: 'Y' | 'N'
  visionYn: 'Y' | 'N'
}

interface Props {
  modelValue: ParamForm
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: ParamForm]
}>()

const isCollapsed = ref(true)

const YN_KEYS: (keyof ParamForm)[] = ['streamYn', 'fnCallYn', 'visionYn']

const onUpdate = (key: keyof ParamForm, value: number | boolean) => {
  const parsed = YN_KEYS.includes(key) && typeof value === 'boolean' ? (value ? 'Y' : 'N') : (value as number)
  emit('update:modelValue', { ...props.modelValue, [key]: parsed })
}
</script>
