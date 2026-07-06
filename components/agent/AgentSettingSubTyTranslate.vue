<template>
  <div class="agent-setting-sub-ty-translate-panel">
    <div class="agent-setting-sub-ty-translate-panel__header">
      <span class="com-setting-section-title">번역 에이전트 구성</span>
      <p class="com-setting-hint agent-setting-sub-ty-translate-panel__summary">
        번역 화면의 안내 문구·언어/톤 선택지·파일 업로드 허용 여부를 아래 영역에서 설정합니다.
      </p>
    </div>

    <div class="agent-setting-sub-ty-translate-panel__accordions">
      <!-- ① UI 문구 -->
      <div class="agent-setting-sub-ty-translate-accordion">
        <UiSettingSection
          title="UI 문구"
          collapsible
          label-width="120px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">인트로 제목</label>
            <UiInput
              :model-value="modelValue.introTitle"
              placeholder="예: 번역"
              size="sm"
              @update:model-value="onUpdate('introTitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">인트로 부제</label>
            <UiInput
              :model-value="modelValue.introSubtitle"
              placeholder="예: 번역할 내용을 입력하거나 파일을 업로드해 주세요."
              size="sm"
              @update:model-value="onUpdate('introSubtitle', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">텍스트 입력 안내</label>
            <UiInput
              :model-value="modelValue.textPlaceholder"
              placeholder="예: 번역할 텍스트를 입력하세요."
              size="sm"
              @update:model-value="onUpdate('textPlaceholder', String($event ?? ''))"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">제출 버튼 라벨</label>
            <UiInput
              :model-value="modelValue.submitLabel"
              placeholder="예: 번역하기"
              size="sm"
              @update:model-value="onUpdate('submitLabel', String($event ?? ''))"
            />
          </div>
        </UiSettingSection>
      </div>

      <!-- ② 언어 목록 -->
      <div class="agent-setting-sub-ty-translate-accordion">
        <UiSettingSection
          title="언어 목록"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <p class="com-setting-hint translate-section-lead">번역 화면에서 선택 가능한 목표 언어 목록입니다.</p>
          <div class="translate-list-block">
            <div class="translate-list-block__head">
              <span class="com-setting-label">언어</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddLanguage"
              >
                언어 추가
              </UiButton>
            </div>
            <p
              v-if="!modelValue.languages.length"
              class="com-setting-hint"
            >
              언어를 추가해 주세요.
            </p>
            <div
              v-for="(lang, idx) in modelValue.languages"
              :key="`language-${idx}`"
              class="translate-list-block__row"
            >
              <UiInput
                :model-value="lang.label"
                size="sm"
                placeholder="라벨 (예: 영어)"
                @update:model-value="onLanguageUpdate(idx, 'label', String($event ?? ''))"
              />
              <UiInput
                :model-value="lang.value"
                size="sm"
                placeholder="값 (예: en)"
                @update:model-value="onLanguageUpdate(idx, 'value', String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemoveLanguage(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- ③ 톤 목록 -->
      <div class="agent-setting-sub-ty-translate-accordion">
        <UiSettingSection
          title="톤 목록"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <p class="com-setting-hint translate-section-lead">번역 화면에서 선택 가능한 번역 톤 목록입니다.</p>
          <div class="translate-list-block">
            <div class="translate-list-block__head">
              <span class="com-setting-label">톤</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddTone"
              >
                톤 추가
              </UiButton>
            </div>
            <p
              v-if="!modelValue.tones.length"
              class="com-setting-hint"
            >
              톤을 추가해 주세요.
            </p>
            <div
              v-for="(tone, idx) in modelValue.tones"
              :key="`tone-${idx}`"
              class="translate-list-block__row"
            >
              <UiInput
                :model-value="tone.label"
                size="sm"
                placeholder="라벨 (예: 자연스럽게)"
                @update:model-value="onToneUpdate(idx, 'label', String($event ?? ''))"
              />
              <UiInput
                :model-value="tone.value"
                size="sm"
                placeholder="값 (예: natural)"
                @update:model-value="onToneUpdate(idx, 'value', String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemoveTone(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>

      <!-- ④ 파일 업로드 -->
      <div class="agent-setting-sub-ty-translate-accordion">
        <UiSettingSection
          title="파일 업로드"
          collapsible
          :default-collapsed="true"
          label-width="120px"
        >
          <div class="com-setting-field-row">
            <label class="com-setting-label">파일 업로드 사용</label>
            <UiCheckbox
              :model-value="modelValue.fileEnabled"
              label="파일을 업로드하여 번역 요청 허용"
              @update:model-value="onUpdate('fileEnabled', $event)"
            />
          </div>

          <div class="translate-list-block">
            <div class="translate-list-block__head">
              <span class="com-setting-label">허용 확장자</span>
              <UiButton
                variant="line-secondary"
                size="xs"
                @click="onAddAcceptExt"
              >
                확장자 추가
              </UiButton>
            </div>
            <p
              v-if="!modelValue.fileAcceptExt.length"
              class="com-setting-hint"
            >
              확장자를 추가해 주세요.
            </p>
            <div
              v-for="(_, idx) in modelValue.fileAcceptExt"
              :key="`ext-${idx}`"
              class="translate-list-block__row"
            >
              <UiInput
                :model-value="modelValue.fileAcceptExt[idx]"
                size="sm"
                placeholder="예: .docx"
                @update:model-value="onAcceptExtUpdate(idx, String($event ?? ''))"
              />
              <button
                type="button"
                class="survey-icon-btn"
                title="삭제"
                @click="onRemoveAcceptExt(idx)"
              >
                <i class="icon-trashcan size-14" />
              </button>
            </div>
          </div>
        </UiSettingSection>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiCheckbox } from '@leechanyong/ispark-ui'
import type { TranslateLanguageOption, TranslateToneOption } from '~/types/agent'
import type { TranslateConfigForm } from '~/utils/agent/translateConfigUtil'

const props = defineProps<{
  modelValue: TranslateConfigForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TranslateConfigForm]
}>()

const emitForm = (next: TranslateConfigForm) => emit('update:modelValue', next)

const onUpdate = <K extends keyof TranslateConfigForm>(key: K, value: TranslateConfigForm[K]) => {
  emitForm({ ...props.modelValue, [key]: value })
}

// ── 언어 목록 ──────────────────────────────────────────────
const onAddLanguage = () => {
  emitForm({ ...props.modelValue, languages: [...props.modelValue.languages, { label: '', value: '' }] })
}

const onLanguageUpdate = <K extends keyof TranslateLanguageOption>(idx: number, key: K, value: string) => {
  const languages = props.modelValue.languages.map((l, i) => (i === idx ? { ...l, [key]: value } : l))
  emitForm({ ...props.modelValue, languages })
}

const onRemoveLanguage = (idx: number) => {
  emitForm({ ...props.modelValue, languages: props.modelValue.languages.filter((_, i) => i !== idx) })
}

// ── 톤 목록 ──────────────────────────────────────────────
const onAddTone = () => {
  emitForm({ ...props.modelValue, tones: [...props.modelValue.tones, { label: '', value: '' }] })
}

const onToneUpdate = <K extends keyof TranslateToneOption>(idx: number, key: K, value: string) => {
  const tones = props.modelValue.tones.map((t, i) => (i === idx ? { ...t, [key]: value } : t))
  emitForm({ ...props.modelValue, tones })
}

const onRemoveTone = (idx: number) => {
  emitForm({ ...props.modelValue, tones: props.modelValue.tones.filter((_, i) => i !== idx) })
}

// ── 허용 확장자 ──────────────────────────────────────────────
const onAddAcceptExt = () => {
  emitForm({ ...props.modelValue, fileAcceptExt: [...props.modelValue.fileAcceptExt, ''] })
}

const onAcceptExtUpdate = (idx: number, value: string) => {
  const fileAcceptExt = props.modelValue.fileAcceptExt.map((e, i) => (i === idx ? value : e))
  emitForm({ ...props.modelValue, fileAcceptExt })
}

const onRemoveAcceptExt = (idx: number) => {
  emitForm({ ...props.modelValue, fileAcceptExt: props.modelValue.fileAcceptExt.filter((_, i) => i !== idx) })
}
</script>

<style lang="scss" scoped>
.agent-setting-sub-ty-translate-panel {
  --label-width: 120px;
  margin-top: 8px;
  padding: 14px 16px 8px;
  border: 1px solid #dce4e9;
  border-radius: $border-radius-lg;
  background: #f8fafc;

  &__header {
    padding-bottom: 12px;
    margin-bottom: 4px;
    border-bottom: 1px solid #aebccb;
  }

  &__summary {
    margin: 6px 0 0;
  }

  &__accordions {
    display: flex;
    flex-direction: column;

    .agent-setting-sub-ty-translate-accordion:last-child :deep(.com-setting-section) {
      border-bottom: none;
      padding-bottom: 4px;
    }
  }
}

.agent-setting-sub-ty-translate-accordion {
  :deep(.com-setting-section) {
    border: none;
    border-radius: 0;
    padding: 10px 0 14px;
    margin: 0;
    background: transparent;
    border-bottom: 1px solid #e2e8f0;
    gap: 10px;
  }

  :deep(.com-setting-section-header) {
    padding-top: 2px;
  }

  :deep(.com-setting-field-row) {
    align-items: flex-start;

    .com-setting-label {
      flex-shrink: 0;
      white-space: normal;
      word-break: keep-all;
      line-height: 1.4;
      padding-top: 6px;
    }

    .ui-input-outer,
    .ui-select-wrap,
    .com-setting-field-input {
      flex: 1;
      min-width: 0;
    }
  }
}

.translate-section-lead {
  margin: 0;
}

.translate-list-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: calc(var(--label-width) + 12px);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .com-setting-label {
      width: auto;
      text-align: left;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;

    :deep(.ui-input-outer) {
      flex: 1;
      min-width: 0;
    }
  }
}

.survey-icon-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: $border-radius-base;
  background: transparent;
  color: $color-text-muted;
  cursor: pointer;

  &:hover {
    background: #eef2f6;
    color: $color-text-dark;
  }
}
</style>
