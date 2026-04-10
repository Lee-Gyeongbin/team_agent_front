<template>
  <div class="com-setting-section">
    <div class="com-setting-section-title">Agent 기본 설정</div>
    <div class="agent-theme-action-row">
      <div class="picker-wrap">
        <button
          class="picker-btn"
          :class="{ 'is-placeholder': isIconUnset }"
          title="아이콘 선택"
          @click="isIconModalOpen = true"
        >
          <i
            :class="[selectedIconClassName, 'size-16']"
            :style="{ color: selectedColorHex }"
          />
        </button>
      </div>
      <div
        ref="colorPickerWrapRef"
        class="picker-wrap"
      >
        <button
          class="picker-btn"
          :class="{ 'is-placeholder': isColorUnset }"
          title="색상 선택"
          @click="toggleColorPicker"
        >
          <span
            class="color-dot"
            :style="{ backgroundColor: selectedColorHex }"
          />
        </button>
        <div
          v-if="isColorPickerOpen"
          class="theme-color-picker"
        >
          <button
            v-for="color in themeColors"
            :key="color.colorId"
            class="theme-color-btn"
            :class="{ 'is-active': modelValue.colorId === color.colorId }"
            :style="{ backgroundColor: color.colorHex }"
            :title="color.colorNm"
            @click="onSelectColor(color.colorId)"
          />
        </div>
      </div>
    </div>

    <!-- Agent 이름 -->
    <div class="com-setting-field-row">
      <label class="com-setting-label"><span class="is-required">*</span>Agent 이름</label>
      <UiInput
        :model-value="modelValue.agentNm"
        placeholder="예: GPT-4o"
        size="sm"
        @update:model-value="onUpdate('agentNm', $event)"
      />
    </div>

    <!-- PORT / Endpoint URL (라벨·인풋 동일 라인) -->
    <div class="com-setting-row endpoint-port-row">
      <div class="com-setting-field-row endpoint-port-field">
        <label class="com-setting-label"> API URL </label>
        <UiSelect
          :model-value="modelValue.apiUrlCd"
          :options="apiUrlCdOptions"
          placeholder="API URL 코드를 선택하세요"
          size="sm"
          @update:model-value="onUpdate('apiUrlCd', String($event ?? ''))"
        />
      </div>
    </div>

    <!-- Agent 설명 -->
    <div class="com-setting-field-row is-top">
      <label class="com-setting-label">
        <span class="is-required">*</span>
        Agent 설명
      </label>
      <UiTextarea
        :model-value="modelValue.description"
        placeholder="등록된 매뉴얼과 문서를 기반으로 사용자 질문에 답변하는 Agent입니다."
        :rows="2"
        size="sm"
        :border="true"
        :auto-resize="true"
        :max-rows="5"
        @update:model-value="onUpdate('description', $event)"
      />
    </div>

    <div
      v-if="svcTy === 'M' || svcTy === 'S'"
      class="com-setting-row type-config-row"
    >
      <div class="type-config-col">
        <label class="com-setting-label">Temperature</label>
        <div class="type-config-option">
          <div class="com-setting-inline">
            <UiInput
              :model-value="modelValue.temperature"
              placeholder="0.7"
              size="sm"
              number-only
              allow-decimal
              @update:model-value="onUpdate('temperature', Number($event))"
            />
            <span class="com-setting-unit">(0.0 ~ 2.0)</span>
          </div>
          <UiCheckbox
            :model-value="modelValue.tempDefaultYn === 'Y'"
            label="모델 기본값 사용"
            @update:model-value="onUpdate('tempDefaultYn', $event ? 'Y' : 'N')"
          />
        </div>
        <span class="com-setting-hint">
          {{
            modelValue.tempDefaultYn === 'Y'
              ? '모델에 설정된 기본 Temperature를 사용합니다.'
              : '출력의 창의성과 무작위성을 조절합니다.'
          }}
        </span>
      </div>
      <div class="type-config-col">
        <label class="com-setting-label">Top P (샘플링)</label>
        <div class="type-config-option">
          <div class="com-setting-inline">
            <UiInput
              :model-value="modelValue.topP"
              placeholder="0.9"
              size="sm"
              number-only
              allow-decimal
              @update:model-value="onUpdate('topP', Number($event))"
            />
            <span class="com-setting-unit">(0.0 ~ 1.0)</span>
          </div>
          <UiCheckbox
            :model-value="modelValue.topPDefaultYn === 'Y'"
            label="모델 기본값 사용"
            @update:model-value="onUpdate('topPDefaultYn', $event ? 'Y' : 'N')"
          />
        </div>
        <span class="com-setting-hint">
          {{
            modelValue.topPDefaultYn === 'Y'
              ? '모델에 설정된 기본 Top P를 사용합니다.'
              : '후보 토큰의 다양성 범위를 조절합니다.'
          }}
        </span>
      </div>
    </div>

    <!-- RAG 설정 (001) -->
    <div
      v-if="svcTy === 'M'"
      class="com-setting-row type-config-row"
    >
      <div class="type-config-col">
        <label class="com-setting-label">유사도 임계값</label>
        <div class="com-setting-inline">
          <UiInput
            :model-value="ragForm.simThresh"
            placeholder="0.0"
            size="sm"
            number-only
            allow-decimal
            @update:model-value="onRagUpdate('simThresh', Number($event))"
          />
          <span class="com-setting-unit">(0.0 ~ 1.0)</span>
        </div>
        <span class="com-setting-hint">이 값 이상의 유사도를 가진 문서만 검색</span>
      </div>
      <div class="type-config-col">
        <label class="com-setting-label">최대 검색 결과</label>
        <div class="com-setting-inline">
          <UiInput
            :model-value="ragForm.maxSrchRslt"
            placeholder="0"
            size="sm"
            number-only
            @update:model-value="onRagUpdate('maxSrchRslt', Number($event))"
          />
          <span class="com-setting-unit">개</span>
        </div>
        <span class="com-setting-hint">최대로 검색할 문서 청크 수</span>
      </div>
    </div>

    <!-- SQL 설정 (002) -->
    <template v-if="svcTy === 'S'">
      <div class="com-setting-row type-config-row">
        <div class="type-config-col">
          <label class="com-setting-label">SQL 생성 모델</label>
          <UiSelect
            :model-value="sqlForm.modelId"
            :options="sqlModelOptions"
            placeholder="모델을 선택하세요"
            size="sm"
            @update:model-value="onSqlUpdate('modelId', $event)"
          />
        </div>
        <div class="type-config-col">
          <label class="com-setting-label">최대 쿼리 실행 시간</label>
          <div class="com-setting-inline">
            <UiInput
              :model-value="sqlForm.maxQrySec"
              placeholder="0"
              size="sm"
              number-only
              @update:model-value="onSqlUpdate('maxQrySec', Number($event))"
            />
            <span class="com-setting-unit">초</span>
          </div>
        </div>
      </div>
      <div class="sql-checkbox-col type-config-row">
        <UiCheckbox
          :model-value="sqlForm.sqlValidYn === 'Y'"
          label="SQL 쿼리 검증 활성화"
          @update:model-value="onSqlUpdate('sqlValidYn', $event ? 'Y' : 'N')"
        />
        <UiCheckbox
          :model-value="sqlForm.readonlyYn === 'Y'"
          label="읽기 전용 모드 (SELECT만 허용)"
          @update:model-value="onSqlUpdate('readonlyYn', $event ? 'Y' : 'N')"
        />
        <UiCheckbox
          :model-value="sqlForm.userCfrmYn === 'Y'"
          label="실행 전 사용자 확인 요청"
          @update:model-value="onSqlUpdate('userCfrmYn', $event ? 'Y' : 'N')"
        />
      </div>
    </template>

    <AgentIconSelectModal
      :is-open="isIconModalOpen"
      :icons="themeIcons"
      :selected-icon-id="modelValue.iconId"
      :selected-color-hex="selectedColorHex"
      @close="isIconModalOpen = false"
      @select="onSelectIcon"
    />
  </div>
</template>

<script setup lang="ts">
import { useAgentStore } from '~/composables/agent/useAgentStore'

interface BasicForm {
  agentNm: string
  apiUrlCd: string
  iconId: string
  colorId: string
  description: string
  temperature: number
  tempDefaultYn: 'Y' | 'N'
  topP: number
  topPDefaultYn: 'Y' | 'N'
}

interface RagForm {
  simThresh: number
  maxSrchRslt: number
}

interface SqlForm {
  modelId: string
  maxQrySec: number
  sqlValidYn: 'Y' | 'N'
  readonlyYn: 'Y' | 'N'
  userCfrmYn: 'Y' | 'N'
}

interface Props {
  modelValue: BasicForm
  svcTy: string
  ragForm: RagForm
  sqlForm: SqlForm
  sqlModelOptions: { value: string; label: string }[]
  apiUrlCdOptions: { value: string | number; label: string }[]
}

const props = defineProps<Props>()
const { themeIcons, themeColors } = useAgentStore()

const emit = defineEmits<{
  'update:modelValue': [value: BasicForm]
  'update:ragForm': [value: RagForm]
  'update:sqlForm': [value: SqlForm]
}>()

const onUpdate = (key: keyof BasicForm, value: string | number | 'Y' | 'N') => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const onRagUpdate = (key: keyof RagForm, value: number) => {
  emit('update:ragForm', { ...props.ragForm, [key]: value })
}

const onSqlUpdate = (key: keyof SqlForm, value: string | number | 'Y' | 'N') => {
  emit('update:sqlForm', { ...props.sqlForm, [key]: value })
}

const isIconModalOpen = ref(false)
const isColorPickerOpen = ref(false)
const colorPickerWrapRef = ref<HTMLElement | null>(null)

const selectedIconClassName = computed(() => {
  return themeIcons.value.find((item) => item.iconId === props.modelValue.iconId)?.iconClassNm ?? 'icon-plus'
})

const selectedColorHex = computed(() => {
  return themeColors.value.find((item) => item.colorId === props.modelValue.colorId)?.colorHex ?? '#94a3b8'
})

const isIconUnset = computed(() => !props.modelValue.iconId)
const isColorUnset = computed(() => !props.modelValue.colorId)

const toggleColorPicker = () => {
  isColorPickerOpen.value = !isColorPickerOpen.value
}

const onSelectIcon = (iconId: string) => {
  onUpdate('iconId', iconId)
  isIconModalOpen.value = false
}

const onSelectColor = (colorId: string) => {
  onUpdate('colorId', colorId)
  isColorPickerOpen.value = false
}

const onClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (colorPickerWrapRef.value && !colorPickerWrapRef.value.contains(target)) {
    isColorPickerOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style lang="scss" scoped>
.agent-theme-action-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;

  .picker-wrap {
    position: relative;
  }

  .picker-btn {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #dce4e9;
    border-radius: $border-radius-base;
    background: #fff;
    transition: border-color 0.2s ease;

    &:hover {
      border-color: #c3ced6;
    }

    &.is-placeholder {
      border-style: dashed;
      border-color: #cbd5e1;
      background: #f8fafc;
    }
  }

  .color-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }
}

.theme-color-picker {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: fit-content;
  padding: 6px;
  border: 1px solid #dce4e9;
  border-radius: $border-radius-base;
  background: #fff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  z-index: 20;
}

.theme-color-btn {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  border: 1px solid transparent;
  border-radius: 50%;
  transition: transform 0.2s ease;

  &.is-active {
    border-color: #0f172a;
  }

  &:hover {
    transform: scale(1.08);
  }
}

.type-config-row {
  margin-left: calc(var(--label-width) + 12px);
}

.type-config-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .com-setting-label {
    width: auto;
    text-align: left;
  }

  .com-setting-hint {
    margin-top: 0;
  }

  .ui-select-wrap {
    width: 100%;
  }
}

.type-config-option {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #dce4e9;
  border-radius: $border-radius-base;
  background: #f8fafc;
}

.sql-checkbox-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.endpoint-port-row {
  .endpoint-port-field {
    flex: 1;
    min-width: 0;

    .ui-select-wrap {
      width: 100% !important;
    }
  }
}
</style>
