<template>
  <section
    class="marketing-image-maker"
    :style="themeStyle"
  >
    <div class="marketing-image-maker__body">
      <div class="marketing-image-maker__field">
        <label><i>*</i> 사용 채널</label>
        <div class="marketing-image-maker__option-grid">
          <button
            v-for="option in imageUsageOptions"
            :key="option.value"
            type="button"
            :class="{ 'is-selected': form.imageUsage === option.value }"
            @click="onSelectImageUsage(option.value)"
          >
            <strong>{{ option.label }}</strong>
            <small>{{ option.description }}</small>
          </button>
        </div>
      </div>

      <div
        v-if="form.imageUsage === 'SNS_VISUAL'"
        ref="snsPlatformFieldRef"
        class="marketing-image-maker__field"
      >
        <label><i>*</i> SNS 채널</label>
        <div class="marketing-image-maker__sns-grid">
          <button
            v-for="option in snsPlatformOptions"
            :key="option.value"
            type="button"
            :class="{ 'is-selected': form.snsPlatform === option.value }"
            @click="onSelectSnsPlatform(option.value)"
          >
            <strong>{{ option.label }}</strong>
            <small v-if="option.description">{{ option.description }}</small>
          </button>
        </div>
      </div>

      <div
        ref="aspectRatioFieldRef"
        class="marketing-image-maker__field"
      >
        <label><i>*</i> 화면 비율</label>
        <div class="marketing-image-maker__ratio-panel">
          <div
            class="marketing-image-maker__ratio-section"
            :class="{
              'is-selected': isPresetAspectRatioMode,
              'is-disabled': !isPresetAspectRatioMode && !!aspectRatioMode,
            }"
            @click="onActivatePresetAspectRatio"
          >
            <div class="marketing-image-maker__ratio-section-head">
              <label
                class="marketing-image-maker__ratio-radio"
                @click.stop
              >
                <input
                  type="radio"
                  name="marketing-image-aspect-ratio-mode"
                  value="preset"
                  :checked="isPresetAspectRatioMode"
                  @change="onActivatePresetAspectRatio"
                />
                <span />
              </label>
              <strong>빠른 화면 비율</strong>
            </div>
            <div class="marketing-image-maker__compact-grid">
              <button
                v-for="ratio in aspectRatioPresets"
                :key="ratio"
                type="button"
                :class="{ 'is-selected': aspectRatioMode === 'preset' && form.aspectRatio === ratio }"
                :disabled="!isPresetAspectRatioMode && !!aspectRatioMode"
                @click.stop="onSelectAspectRatioPreset(ratio)"
              >
                {{ ratio }}
              </button>
            </div>
          </div>

          <div
            class="marketing-image-maker__ratio-section"
            :class="{
              'is-selected': isCustomAspectRatioMode,
              'is-disabled': !isCustomAspectRatioMode && !!aspectRatioMode,
            }"
            @click="onActivateCustomAspectRatio"
          >
            <div class="marketing-image-maker__ratio-section-head">
              <label
                class="marketing-image-maker__ratio-radio"
                @click.stop
              >
                <input
                  type="radio"
                  name="marketing-image-aspect-ratio-mode"
                  value="custom"
                  :checked="isCustomAspectRatioMode"
                  @change="onActivateCustomAspectRatio"
                />
                <span />
              </label>
              <strong>직접 화면 비율</strong>
            </div>
            <div class="marketing-image-maker__ratio-custom">
              <div class="marketing-image-maker__ratio-part">
                <span>가로</span>
                <UiInput
                  ref="customAspectWidthInputRef"
                  v-model="customAspectWidth"
                  placeholder="3"
                  size="sm"
                  number-only
                  :disabled="!isCustomAspectRatioMode"
                  @click.stop
                  @update:model-value="onCustomAspectRatioChange"
                />
              </div>
              <span class="marketing-image-maker__ratio-sep">:</span>
              <div class="marketing-image-maker__ratio-part">
                <span>세로</span>
                <UiInput
                  ref="customAspectHeightInputRef"
                  v-model="customAspectHeight"
                  placeholder="2"
                  size="sm"
                  number-only
                  :disabled="!isCustomAspectRatioMode"
                  @click.stop
                  @update:model-value="onCustomAspectRatioChange"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="marketing-image-maker__row">
        <div class="marketing-image-maker__field">
          <label><i>*</i> 제작 목적</label>
          <UiInput
            v-model="form.purpose"
            placeholder="예: 신상품 출시 홍보"
            size="sm"
          />
        </div>
        <div class="marketing-image-maker__field">
          <label><i>*</i> 대상 고객</label>
          <UiInput
            v-model="form.audience"
            placeholder="예: 20~30대 직장인"
            size="sm"
          />
        </div>
      </div>

      <div class="marketing-image-maker__field">
        <label><i>*</i> 홍보할 상품·서비스</label>
        <UiTextarea
          v-model="form.productInformation"
          placeholder="상품명, 주요 특징, 혜택과 차별점을 입력해 주세요."
          :rows="4"
          :max-length="1000"
          border
        />
      </div>

      <div class="marketing-image-maker__field">
        <label><i>*</i> 핵심 메시지</label>
        <UiTextarea
          v-model="form.coreMessage"
          placeholder="이미지에서 가장 강조할 메시지를 입력해 주세요."
          :rows="3"
          :max-length="300"
          border
        />
      </div>

      <div class="marketing-image-maker__field">
        <label><i>*</i> 표현 방식</label>
        <div class="marketing-image-maker__option-grid">
          <button
            v-for="option in imageTypeOptions"
            :key="option.value"
            type="button"
            :class="{ 'is-selected': form.imageType === option.value }"
            @click="form.imageType = option.value"
          >
            <strong>{{ option.label }}</strong>
            <small>{{ option.description }}</small>
          </button>
        </div>
      </div>

      <div class="marketing-image-maker__field">
        <label><i>*</i> 분위기</label>
        <UiSelect
          v-model="form.visualStyle"
          :options="atmosphereOptions"
          placeholder="분위기를 선택하세요"
          size="sm"
        />
      </div>

      <div class="marketing-image-maker__row">
        <div class="marketing-image-maker__field">
          <label>이미지 내 문구</label>
          <UiInput
            v-model="form.imageText"
            placeholder="비워두면 문구 없이 생성"
            size="sm"
          />
        </div>
        <div class="marketing-image-maker__field">
          <label>브랜드 컬러</label>
          <UiInput
            v-model="form.brandColors"
            placeholder="예: #7346E8, 흰색"
            size="sm"
          />
        </div>
      </div>

      <div class="marketing-image-maker__field">
        <label>참고 파일 <small>(선택)</small></label>
        <UiFileUpload
          v-model="form.referenceFiles"
          :accept="referenceAccept"
          :allowed-extensions="referenceAllowedExtensions"
          :max-files="5"
          multiple
          hint="브랜드 가이드·로고·참고 이미지 등 문서·이미지 파일을 최대 5개까지 첨부할 수 있습니다."
        />
      </div>

      <div class="marketing-image-maker__field">
        <label>추가 요청사항 <small>(선택)</small></label>
        <UiTextarea
          v-model="form.additionalRequirements"
          placeholder="구도, 배경, 포함하거나 제외할 요소를 입력해 주세요."
          :rows="3"
          :max-length="500"
          border
        />
      </div>

      <div
        ref="variantCountFieldRef"
        class="marketing-image-maker__field"
      >
        <label><i>*</i> 시안 생성 개수</label>
        <div class="marketing-image-maker__variant-count">
          <button
            v-for="count in variantCountOptions"
            :key="count"
            type="button"
            :class="{ 'is-selected': form.variantCount === count }"
            @click="form.variantCount = count"
          >
            {{ count }}
          </button>
        </div>
      </div>
    </div>

    <footer class="marketing-image-maker__footer">
      <UiButton
        variant="line-secondary"
        size="sm"
        @click="emit('back')"
      >
        이전
      </UiButton>
      <UiButton
        variant="secondary"
        size="sm"
        @click="onSubmit"
      >
        이미지 생성
      </UiButton>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'
import {
  MARKETING_IMAGE_ATMOSPHERES,
  MARKETING_IMAGE_SNS_DEFAULT_ASPECT_RATIO,
  MARKETING_IMAGE_SNS_PLATFORMS,
  MARKETING_IMAGE_TYPES,
  MARKETING_IMAGE_USAGES,
} from '~/utils/agent/marketingAuthoringConfigUtil'
import type { MarketingImageFormPayload } from '~/types/chat'
import {
  clampMarketingAuthoringVariantCount,
  MARKETING_AUTHORING_VARIANT_COUNT_MAX,
} from '~/utils/chat/marketingAuthoringUtil'

const props = withDefaults(
  defineProps<{
    themeColorHex?: string
  }>(),
  {
    themeColorHex: '',
  },
)

const emit = defineEmits<{
  back: []
  submit: [payload: MarketingImageFormPayload]
}>()

const imageUsageOptions = MARKETING_IMAGE_USAGES
const imageTypeOptions = MARKETING_IMAGE_TYPES
const snsPlatformOptions = MARKETING_IMAGE_SNS_PLATFORMS
const referenceAllowedExtensions = 'pdf,doc,docx,ppt,pptx,xls,xlsx,hwp,csv,txt,png,jpg,jpeg,webp'.split(',')
const referenceAccept = referenceAllowedExtensions.map((ext) => `.${ext}`).join(',')
const atmosphereOptions = [
  { label: '선택', value: '' },
  ...MARKETING_IMAGE_ATMOSPHERES.map((item) => ({ label: item.label, value: item.value })),
]
const aspectRatioPresets = ['1:1', '3:2', '4:3', '16:9', '9:16'] as const

/** 사용 채널별 기본 화면 비율 — SNS는 하위 채널 선택 시 적용 */
const USAGE_DEFAULT_ASPECT_RATIO: Record<string, (typeof aspectRatioPresets)[number]> = {
  BANNER: '16:9',
  THUMBNAIL: '1:1',
  PRODUCT_DETAIL: '3:2',
}

const form = reactive<MarketingImageFormPayload>({
  imageUsage: '',
  snsPlatform: '',
  imageType: '',
  purpose: '',
  audience: '',
  visualStyle: '',
  aspectRatio: '',
  customAspectRatio: '',
  imageText: '',
  coreMessage: '',
  productInformation: '',
  brandColors: '',
  additionalRequirements: '',
  referenceFiles: [],
  variantCount: 0,
})

const variantCountOptions = Array.from({ length: MARKETING_AUTHORING_VARIANT_COUNT_MAX }, (_, index) => index + 1)

/** 화면 비율 입력 모드 — 빠른 선택 / 직접 입력은 상호 배타 */
const aspectRatioMode = ref<'preset' | 'custom' | ''>('')
const customAspectWidth = ref('')
const customAspectHeight = ref('')

const aspectRatioFieldRef = ref<HTMLElement | null>(null)
const snsPlatformFieldRef = ref<HTMLElement | null>(null)
const variantCountFieldRef = ref<HTMLElement | null>(null)
const customAspectWidthInputRef = ref<{ focus: () => void } | null>(null)
const customAspectHeightInputRef = ref<{ focus: () => void } | null>(null)

const isPresetAspectRatioMode = computed(() => aspectRatioMode.value === 'preset')
const isCustomAspectRatioMode = computed(() => aspectRatioMode.value === 'custom')

const themeStyle = computed(() => ({
  '--marketing-image-color': props.themeColorHex || '#7346e8',
}))

const focusField = async (fieldEl: HTMLElement | null, input?: { focus: () => void } | null) => {
  fieldEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  await nextTick()
  input?.focus()
}

const syncCustomAspectRatio = () => {
  const width = customAspectWidth.value.trim()
  const height = customAspectHeight.value.trim()
  if (!width || !height || Number(width) <= 0 || Number(height) <= 0) {
    form.aspectRatio = ''
    form.customAspectRatio = ''
    return
  }
  form.aspectRatio = 'OTHER'
  form.customAspectRatio = `${width}:${height}`
}

const clearCustomAspectRatio = () => {
  customAspectWidth.value = ''
  customAspectHeight.value = ''
  form.customAspectRatio = ''
}

const clearPresetAspectRatio = () => {
  form.aspectRatio = ''
}

const onSelectAspectRatioPreset = (ratio: string) => {
  aspectRatioMode.value = 'preset'
  form.aspectRatio = ratio
  clearCustomAspectRatio()
}

const onActivatePresetAspectRatio = () => {
  if (aspectRatioMode.value === 'preset') return
  aspectRatioMode.value = 'preset'
  clearCustomAspectRatio()
  clearPresetAspectRatio()
}

const onSelectImageUsage = (value: string) => {
  form.imageUsage = value
  if (value === 'SNS_VISUAL') {
    form.snsPlatform = ''
    aspectRatioMode.value = ''
    clearPresetAspectRatio()
    clearCustomAspectRatio()
    return
  }

  form.snsPlatform = ''
  const defaultRatio = USAGE_DEFAULT_ASPECT_RATIO[value]
  if (defaultRatio) onSelectAspectRatioPreset(defaultRatio)
}

const onSelectSnsPlatform = (value: string) => {
  form.snsPlatform = value
  const defaultRatio = MARKETING_IMAGE_SNS_DEFAULT_ASPECT_RATIO[value]
  if (defaultRatio) onSelectAspectRatioPreset(defaultRatio)
}

const onActivateCustomAspectRatio = async () => {
  if (aspectRatioMode.value === 'custom') return
  aspectRatioMode.value = 'custom'
  clearPresetAspectRatio()
  clearCustomAspectRatio()
  await nextTick()
  customAspectWidthInputRef.value?.focus()
}

const onCustomAspectRatioChange = () => {
  if (aspectRatioMode.value !== 'custom') {
    aspectRatioMode.value = 'custom'
    clearPresetAspectRatio()
  }
  syncCustomAspectRatio()
}

const onSubmit = async () => {
  if (aspectRatioMode.value === 'custom') {
    syncCustomAspectRatio()
  }

  if (
    !form.imageUsage ||
    !form.imageType ||
    !form.purpose.trim() ||
    !form.audience.trim() ||
    !form.visualStyle ||
    !form.productInformation.trim() ||
    !form.coreMessage.trim()
  ) {
    openToast({ message: '이미지 제작의 필수 항목을 모두 입력해 주세요.', type: 'warning' })
    return
  }

  if (form.imageUsage === 'SNS_VISUAL' && !form.snsPlatform) {
    openToast({ message: 'SNS 채널을 선택해 주세요.', type: 'warning' })
    await focusField(snsPlatformFieldRef.value)
    return
  }

  if (aspectRatioMode.value === 'preset') {
    if (!form.aspectRatio) {
      openToast({ message: '화면 비율을 선택해 주세요.', type: 'warning' })
      await focusField(aspectRatioFieldRef.value)
      return
    }
  } else if (aspectRatioMode.value === 'custom') {
    const width = customAspectWidth.value.trim()
    const height = customAspectHeight.value.trim()
    if (!width || Number(width) <= 0) {
      openToast({ message: '화면 비율의 가로 값을 입력해 주세요.', type: 'warning' })
      await focusField(aspectRatioFieldRef.value, customAspectWidthInputRef.value)
      return
    }
    if (!height || Number(height) <= 0) {
      openToast({ message: '화면 비율의 세로 값을 입력해 주세요.', type: 'warning' })
      await focusField(aspectRatioFieldRef.value, customAspectHeightInputRef.value)
      return
    }
  } else {
    openToast({ message: '화면 비율을 선택하거나 직접 입력해 주세요.', type: 'warning' })
    await focusField(aspectRatioFieldRef.value)
    return
  }

  if (form.variantCount < 1) {
    openToast({ message: '시안 생성 개수를 선택해 주세요.', type: 'warning' })
    await focusField(variantCountFieldRef.value)
    return
  }

  form.variantCount = clampMarketingAuthoringVariantCount(form.variantCount)

  emit('submit', {
    ...form,
    referenceFiles: [...form.referenceFiles],
  })
}
</script>
