<template>
  <section
    class="content-maker"
    :style="themeStyle"
  >
    <nav class="content-maker__steps">
      <template
        v-for="(step, index) in stepDefinitions"
        :key="step.title"
      >
        <div
          class="content-maker__step"
          :class="{ 'is-active': currentStep === index, 'is-complete': currentStep > index }"
        >
          <span>
            <i
              v-if="currentStep > index"
              class="icon-check size-14"
            />
            <template v-else>{{ index + 1 }}</template>
          </span>
          <strong>{{ step.title }}</strong>
        </div>
        <i
          v-if="index < stepDefinitions.length - 1"
          class="content-maker__step-line"
          :class="{ 'is-complete': currentStep > index }"
        />
      </template>
    </nav>

    <main
      ref="bodyRef"
      class="content-maker__body"
    >
      <div class="content-maker__heading">
        <em>STEP {{ currentStep + 1 }}</em>
        <h3>{{ currentStepDefinition.title }}</h3>
        <p>{{ currentStepDefinition.description }}</p>
      </div>

      <template v-if="currentStep === 0">
        <div
          :ref="(el) => setFieldRef('contentType', el as HTMLElement | null)"
          class="content-maker__field"
        >
          <label><i>*</i> 콘텐츠 유형</label>
          <div class="content-maker__option-grid">
            <button
              v-for="option in contentTypeOptions"
              :key="option.value"
              type="button"
              :class="{ 'is-selected': form.contentType === option.value }"
              @click="selectContentType(option.value)"
            >
              <span>
                <strong>{{ option.label }}</strong>
                <small v-if="option.description">{{ option.description }}</small>
              </span>
              <i
                v-if="form.contentType === option.value"
                class="icon-check size-16"
              />
            </button>
          </div>
        </div>

        <div
          v-if="channelOptions.length"
          :ref="(el) => setFieldRef('channel', el as HTMLElement | null)"
          class="content-maker__field"
        >
          <label><i>*</i> 게시 채널</label>
          <div class="content-maker__compact-grid">
            <button
              v-for="option in channelOptions"
              :key="option.value"
              type="button"
              :class="{ 'is-selected': form.channel === option.value }"
              @click="form.channel = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <UiInput
            v-if="form.channel === 'OTHER'"
            v-model="form.customChannel"
            placeholder="게시 채널을 직접 입력해 주세요."
            size="sm"
          />
        </div>

        <div
          v-if="purposeOptions.length"
          :ref="(el) => setFieldRef('purpose', el as HTMLElement | null)"
          class="content-maker__field"
        >
          <label><i>*</i> 작성 목적</label>
          <div class="content-maker__option-grid">
            <button
              v-for="option in purposeOptions"
              :key="option.value"
              type="button"
              :class="{ 'is-selected': form.purpose === option.value }"
              @click="form.purpose = option.value"
            >
              <span>
                <strong>{{ option.label }}</strong>
                <small v-if="option.description">{{ option.description }}</small>
              </span>
              <i
                v-if="form.purpose === option.value"
                class="icon-check size-16"
              />
            </button>
          </div>
          <UiInput
            v-if="form.purpose === 'OTHER'"
            v-model="form.customPurpose"
            placeholder="작성 목적을 직접 입력해 주세요."
            size="sm"
          />
        </div>

        <div
          v-if="audienceOptions.length"
          :ref="(el) => setFieldRef('audience', el as HTMLElement | null)"
          class="content-maker__field"
        >
          <label><i>*</i> 대상 독자</label>
          <div class="content-maker__option-grid">
            <button
              v-for="option in audienceOptions"
              :key="option.value"
              type="button"
              :class="{ 'is-selected': form.audience === option.value }"
              @click="form.audience = option.value"
            >
              <span>
                <strong>{{ option.label }}</strong>
                <small v-if="option.description">{{ option.description }}</small>
              </span>
              <i
                v-if="form.audience === option.value"
                class="icon-check size-16"
              />
            </button>
          </div>
          <UiInput
            v-if="form.audience === 'OTHER'"
            v-model="form.customAudience"
            placeholder="대상 독자를 직접 입력해 주세요."
            size="sm"
          />
        </div>

        <div
          :ref="(el) => setFieldRef('tones', el as HTMLElement | null)"
          class="content-maker__field"
        >
          <label><i>*</i> 톤앤매너 <small>(최대 2개 선택)</small></label>
          <div class="content-maker__tone-grid">
            <button
              v-for="tone in toneOptions"
              :key="tone.value"
              type="button"
              :class="{ 'is-selected': form.tones.includes(tone.value) }"
              @click="toggleTone(tone.value)"
            >
              <span class="content-maker__checkbox">
                <i
                  v-if="form.tones.includes(tone.value)"
                  class="icon-check size-12"
                />
              </span>
              {{ tone.label }}
            </button>
            <button
              v-if="!toneOptions.some((tone) => tone.value === 'OTHER')"
              type="button"
              :class="{ 'is-selected': form.tones.includes('OTHER') }"
              @click="toggleTone('OTHER')"
            >
              <i class="icon-edit size-16" />
              기타 직접 입력
            </button>
          </div>
          <UiInput
            v-if="form.tones.includes('OTHER')"
            v-model="form.customTone"
            placeholder="원하는 톤앤매너를 입력해 주세요."
            size="sm"
          />
        </div>

        <div
          v-if="lengthOptions.length"
          :ref="(el) => setFieldRef('length', el as HTMLElement | null)"
          class="content-maker__field"
        >
          <label><i>*</i> 분량</label>
          <div class="content-maker__length-grid">
            <button
              v-for="length in lengthOptions"
              :key="length.value"
              type="button"
              :class="{ 'is-selected': form.length === length.value }"
              @click="selectLength(length.value)"
            >
              <strong>{{ length.label }}</strong>
              <span v-if="length.description">{{ length.description }}</span>
            </button>
          </div>
          <UiInput
            v-if="form.length === 'CUSTOM'"
            v-model="form.customLength"
            placeholder="예: 1,000자"
            size="sm"
          />
        </div>

        <div
          :ref="(el) => setFieldRef('variantCount', el as HTMLElement | null)"
          class="content-maker__field"
        >
          <label><i>*</i> 시안 생성 개수</label>
          <div class="content-maker__variant-count">
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
      </template>

      <template v-else-if="currentStep === 1">
        <div
          :ref="(el) => setFieldRef('promotionInformation', el as HTMLElement | null)"
          class="content-maker__field"
        >
          <label><i>*</i> 홍보할 상품·서비스</label>
          <div class="content-maker__control">
            <UiTextarea
              v-model="form.promotionInformation"
              placeholder="상품·서비스명, 주요 특징, 가격·혜택, 차별점, 프로모션 정보를 입력해 주세요."
              :rows="5"
              :max-length="1000"
              :auto-resize="false"
              border
            />
            <span>{{ form.promotionInformation.length }} / 1000</span>
          </div>
        </div>
        <div
          :ref="(el) => setFieldRef('keyMessage', el as HTMLElement | null)"
          class="content-maker__field"
        >
          <label><i>*</i> 핵심 메시지</label>
          <div class="content-maker__control">
            <UiTextarea
              v-model="form.keyMessage"
              placeholder="콘텐츠에서 가장 강조하고 싶은 메시지를 입력해 주세요."
              :rows="3"
              :max-length="200"
              :auto-resize="false"
              border
            />
            <span>{{ form.keyMessage.length }} / 200</span>
          </div>
        </div>
        <div
          :ref="(el) => setFieldRef('customCallToAction', el as HTMLElement | null)"
          class="content-maker__field"
        >
          <label><i>*</i> 유도할 행동 (CTA)</label>
          <div class="content-maker__control">
            <UiInput
              v-model="form.customCallToAction"
              placeholder="예: 자세히 보기, 신청하기, 문의하기"
              :max-length="50"
              size="sm"
            />
            <span>{{ form.customCallToAction.length }} / 50</span>
          </div>
        </div>
        <aside class="content-maker__tip">
          <i class="icon-info size-18" />
          <div>
            <strong>TIP</strong>
            <p>입력할 내용이 구체적일수록 더 정확하고 효과적인 콘텐츠가 생성됩니다.</p>
          </div>
        </aside>
      </template>

      <template v-else>
        <section class="content-maker__panel">
          <h4>콘텐츠 스타일</h4>
          <div class="content-maker__radio-field">
            <label><i>*</i> 해시태그 포함</label>
            <div>
              <label>
                <input
                  v-model="form.includeHashtags"
                  type="radio"
                  value="Y"
                />
                <span />
                포함
              </label>
              <label>
                <input
                  v-model="form.includeHashtags"
                  type="radio"
                  value="N"
                />
                <span />
                포함하지 않음
              </label>
            </div>
          </div>
          <div
            v-if="workflow.outputSections.length"
            :ref="(el) => setFieldRef('outputSections', el as HTMLElement | null)"
            class="content-maker__field"
          >
            <label><i>*</i> 콘텐츠 출력 구성</label>
            <div class="content-maker__output-options">
              <UiCheckbox
                v-for="option in workflow.outputSections"
                :key="option.value"
                :model-value="form.outputSections.includes(option.value)"
                :label="option.label"
                @update:model-value="toggleOutputSection(option.value, $event)"
              />
            </div>
          </div>
        </section>

        <section class="content-maker__panel">
          <h4>참고 자료 <small>(선택)</small></h4>
          <div class="content-maker__field">
            <label>참고 방식</label>
            <div class="content-maker__reference-modes">
              <button
                v-for="mode in referenceModeOptions"
                :key="mode.value"
                type="button"
                :class="{ 'is-selected': form.referenceMode === mode.value }"
                @click="selectReferenceMode(mode.value)"
              >
                <i :class="[mode.icon, 'size-22']" />
                <strong>{{ mode.label }}</strong>
                <span>{{ mode.description }}</span>
              </button>
            </div>
          </div>

          <div
            v-if="form.referenceMode === 'FILE'"
            :ref="(el) => setFieldRef('referenceFiles', el as HTMLElement | null)"
            class="content-maker__field"
          >
            <label><i>*</i> 파일 업로드</label>
            <UiFileUpload
              v-model="form.referenceFiles"
              :accept="referenceAccept"
              :allowed-extensions="referenceAllowedExtensions"
              :max-files="5"
              multiple
              hint="문서·이미지 파일을 최대 5개까지 첨부할 수 있습니다."
            />
          </div>

          <div
            v-else-if="form.referenceMode === 'WEB'"
            :ref="(el) => setFieldRef('referenceUrls', el as HTMLElement | null)"
            class="content-maker__field"
          >
            <label><i>*</i> 웹 URL</label>
            <div
              v-for="(_, index) in form.referenceUrls"
              :key="index"
              class="content-maker__url-row"
            >
              <UiInput
                v-model="form.referenceUrls[index]"
                :placeholder="`https://example.com/reference-${index + 1}`"
                size="sm"
              />
              <button
                type="button"
                aria-label="URL 삭제"
                @click="removeReferenceUrl(index)"
              >
                <i class="icon-close size-16" />
              </button>
            </div>
            <button
              v-if="form.referenceUrls.length < 5"
              type="button"
              class="content-maker__add-url"
              @click="form.referenceUrls.push('')"
            >
              <i class="icon-plus size-14" />
              URL 추가
            </button>
          </div>

          <div class="content-maker__field">
            <label>추가 요청사항 <small>(선택)</small></label>
            <div class="content-maker__control">
              <UiTextarea
                v-model="form.additionalRequirements"
                placeholder="콘텐츠 제작 시 참고할 내용을 입력해 주세요."
                :rows="3"
                :max-length="200"
                :auto-resize="false"
                border
              />
              <span>{{ form.additionalRequirements.length }} / 200</span>
            </div>
          </div>
        </section>
      </template>
    </main>

    <footer class="content-maker__footer">
      <UiButton
        variant="line-secondary"
        size="sm"
        @click="currentStep === 0 ? emit('close') : goToPreviousStep()"
      >
        <template #icon-left>
          <i class="icon-arrow-right size-16 content-maker__prev-arrow" />
        </template>
        이전
      </UiButton>
      <UiButton
        variant="secondary"
        size="sm"
        @click="currentStep < 2 ? goToNextStep() : onSubmit()"
      >
        {{ currentStep < 2 ? '다음' : config.ui.submitLabel }}
        <template #icon-right>
          <i :class="[currentStep < 2 ? 'icon-arrow-right' : 'icon-sparkle', 'size-16']" />
        </template>
      </UiButton>
    </footer>
  </section>
</template>

<script setup lang="ts">
import type { MarketingAuthoringAgentConfig } from '~/types/agent'
import type { MarketingAuthoringFormPayload } from '~/types/chat'
import {
  clampMarketingAuthoringVariantCount,
  createEmptyMarketingAuthoringPayload,
  getMarketingAuthoringWorkflow,
  MARKETING_AUTHORING_VARIANT_COUNT_MAX,
} from '~/utils/chat/marketingAuthoringUtil'
import { openToast } from '~/composables/useToast'

const props = withDefaults(
  defineProps<{
    config: MarketingAuthoringAgentConfig
    themeColorHex?: string
  }>(),
  {
    themeColorHex: '',
  },
)

const emit = defineEmits<{
  submit: [payload: MarketingAuthoringFormPayload]
  close: []
}>()

const form = reactive(createEmptyMarketingAuthoringPayload())
const currentStep = ref(0)
const bodyRef = ref<HTMLElement | null>(null)

const workflow = computed(() => getMarketingAuthoringWorkflow(props.config))
const themeStyle = computed(() => ({
  '--content-maker-color': props.themeColorHex || '#7346e8',
}))

const stepDefinitions = [
  { title: '기본 설정', description: '콘텐츠의 유형과 작성 목적, 대상, 톤앤매너, 분량을 설정해 주세요.' },
  { title: '홍보 내용', description: '콘텐츠 제작에 필요한 홍보 정보를 입력해 주세요.' },
  { title: '표현 및 참고자료', description: '콘텐츠 스타일을 설정하고 참고할 자료를 선택해 주세요.' },
]
const currentStepDefinition = computed(() => stepDefinitions[currentStep.value])

/** Agent 설정의 콘텐츠 유형·워크플로·채널 옵션을 그대로 사용 */
const contentTypeOptions = computed(() => props.config.contentTypes ?? [])
const purposeOptions = computed(() => workflow.value.purposes ?? [])
const audienceOptions = computed(() => workflow.value.audiences ?? [])
const toneOptions = computed(() => workflow.value.tones ?? [])
const lengthOptions = computed(() => workflow.value.lengths ?? [])
const channelOptions = computed(() => props.config.channelsByContentType?.[form.contentType] ?? [])

const referenceModeOptions: Array<{
  value: 'FILE' | 'WEB'
  label: string
  description: string
  icon: string
}> = [
  { value: 'FILE', label: '파일 업로드', description: '문서·이미지 파일을 업로드하여 참고', icon: 'icon-attach-file' },
  { value: 'WEB', label: '참고 웹 URL', description: '참고할 웹페이지 URL을 입력', icon: 'icon-search' },
]

/** 참고자료 첨부 허용 형식 — 문서 + 이미지 */
const referenceAllowedExtensions = 'pdf,doc,docx,ppt,pptx,xls,xlsx,hwp,csv,txt,png,jpg,jpeg'.split(',')
const referenceAccept = referenceAllowedExtensions.map((ext) => `.${ext}`).join(',')

const variantCountOptions = Array.from({ length: MARKETING_AUTHORING_VARIANT_COUNT_MAX }, (_, index) => index + 1)

const selectContentType = (value: string) => {
  form.contentType = value
  form.purpose = ''
  form.audience = ''
  form.tones = []
  form.length = ''
  form.customTone = ''
  form.customLength = ''
  form.customPurpose = ''
  form.customAudience = ''
  form.channel = ''
  form.customChannel = ''
  form.outputSections = [...workflow.value.defaultOutputSections]
}

const toggleTone = (value: string) => {
  if (form.tones.includes(value)) {
    form.tones = form.tones.filter((tone) => tone !== value)
    if (value === 'OTHER') form.customTone = ''
    return
  }
  if (form.tones.length >= 2) {
    openToast({ message: '톤앤매너는 최대 2개까지 선택할 수 있습니다.', type: 'warning' })
    return
  }
  form.tones = [...form.tones, value]
}

const selectLength = (value: string) => {
  form.length = value
  if (value !== 'CUSTOM') form.customLength = ''
}

const selectReferenceMode = (value: 'FILE' | 'WEB') => {
  if (form.referenceMode === value) {
    form.referenceMode = ''
    form.referenceFiles = []
    form.referenceUrls = ['']
    return
  }
  form.referenceMode = value
  if (value === 'FILE') form.referenceUrls = ['']
  if (value === 'WEB' && form.referenceUrls.length === 0) form.referenceUrls.push('')
}

const toggleOutputSection = (value: string, checked: boolean) => {
  form.outputSections = checked
    ? [...new Set([...form.outputSections, value])]
    : form.outputSections.filter((section) => section !== value)
}

const removeReferenceUrl = (index: number) => {
  form.referenceUrls.splice(index, 1)
  if (form.referenceUrls.length === 0) form.referenceUrls.push('')
}

const scrollToTop = () => {
  nextTick(() => bodyRef.value?.scrollTo({ top: 0, behavior: 'smooth' }))
}

// ━━━ 필드 ref 관리 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fieldRefs = ref<Record<string, HTMLElement | null>>({})
const setFieldRef = (key: string, el: HTMLElement | null) => {
  fieldRefs.value[key] = el
}

/** 미입력 필드로 스크롤 이동 + 포커스 — 다른 스텝이면 해당 스텝으로 먼저 이동 */
const focusField = async (key: string, step: number) => {
  currentStep.value = step
  await nextTick()
  const fieldEl = fieldRefs.value[key]
  if (!fieldEl) return
  fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  fieldEl
    .querySelector<HTMLElement>('input,textarea,button,[tabindex]:not([tabindex="-1"])')
    ?.focus({ preventScroll: true })
}

const goToPreviousStep = () => {
  currentStep.value--
  scrollToTop()
}

const REQUIRED_FIELD_MESSAGE = '필수 항목을 모두 입력해 주세요.'

/** 화면 순서대로 검사 — 첫 미입력 필드 key 반환 */
const findMissingBasicField = (): string | null => {
  const checks: Array<{ key: string; isInvalid: boolean }> = [
    { key: 'contentType', isInvalid: !form.contentType },
    { key: 'channel', isInvalid: channelOptions.value.length > 0 && !form.channel },
    { key: 'channel', isInvalid: form.channel === 'OTHER' && !form.customChannel.trim() },
    { key: 'purpose', isInvalid: purposeOptions.value.length > 0 && !form.purpose },
    { key: 'purpose', isInvalid: form.purpose === 'OTHER' && !form.customPurpose.trim() },
    { key: 'audience', isInvalid: audienceOptions.value.length > 0 && !form.audience },
    { key: 'audience', isInvalid: form.audience === 'OTHER' && !form.customAudience.trim() },
    { key: 'tones', isInvalid: !form.tones.length },
    { key: 'tones', isInvalid: form.tones.includes('OTHER') && !form.customTone.trim() },
    { key: 'length', isInvalid: lengthOptions.value.length > 0 && !form.length },
    { key: 'length', isInvalid: form.length === 'CUSTOM' && !form.customLength.trim() },
    { key: 'variantCount', isInvalid: form.variantCount < 1 },
  ]
  return checks.find((check) => check.isInvalid)?.key ?? null
}

const validateBasicStep = () => {
  const missingKey = findMissingBasicField()
  if (missingKey) {
    openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
    focusField(missingKey, 0)
    return false
  }
  form.variantCount = clampMarketingAuthoringVariantCount(form.variantCount)
  return true
}

const validatePromotionStep = () => {
  const missingKey = [
    { key: 'promotionInformation', isInvalid: !form.promotionInformation.trim() },
    { key: 'keyMessage', isInvalid: !form.keyMessage.trim() },
    { key: 'customCallToAction', isInvalid: !form.customCallToAction.trim() },
  ].find((check) => check.isInvalid)?.key
  if (missingKey) {
    openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
    focusField(missingKey, 1)
    return false
  }
  return true
}

const goToNextStep = () => {
  if (currentStep.value === 0 && !validateBasicStep()) return
  if (currentStep.value === 1 && !validatePromotionStep()) return
  currentStep.value++
  scrollToTop()
}

const validateReference = () => {
  if (form.referenceMode === 'FILE' && form.referenceFiles.length > 5) {
    openToast({ message: '참고 일 최대 5개까지 첨부할 수 있습니다.', type: 'warning' })
    focusField('referenceFiles', 2)
    return false
  }
  if (form.referenceMode !== 'WEB') return true

  const urls = form.referenceUrls.map((value) => value.trim()).filter(Boolean)
  if (urls.length > 5) {
    openToast({ message: '참고 URL 최대 5개까지 입력할 수 있습니다.', type: 'warning' })
    focusField('referenceUrls', 2)
    return false
  }
  // 입력한 URL 형식 검증(비어있는 경우 예외)
  const invalidUrl = urls.find((value) => {
    try {
      return !['http:', 'https:'].includes(new URL(value).protocol)
    } catch {
      return true
    }
  })
  if (invalidUrl) {
    openToast({ message: `올바른 URL을 입력해 주세요: ${invalidUrl}`, type: 'warning' })
    focusField('referenceUrls', 2)
    return false
  }
  return true
}

const onSubmit = () => {
  if (!validateBasicStep() || !validatePromotionStep()) return
  if (workflow.value.outputSections.length && !form.outputSections.length) {
    openToast({ message: REQUIRED_FIELD_MESSAGE, type: 'warning' })
    focusField('outputSections', 2)
    return
  }
  if (!validateReference()) return
  emit('submit', {
    ...form,
    tones: [...form.tones],
    referenceFiles: [...form.referenceFiles],
    referenceUrls: [...form.referenceUrls],
    outputSections: [...form.outputSections],
  })
}
</script>
