<template>
  <div class="pt-panel pt-panel--lg pt-template-gen-panel">
    <!-- 생성 전 초기 상태 -->
    <template v-if="!template">
      <h3 class="pt-panel-title">템플릿 생성</h3>
      <p class="pt-panel-desc">
        Step3에서 확정한 컬러와 스타일을 기반으로, AI가 슬라이드 헤더와 푸터 레이아웃을 생성합니다.
      </p>
      <div class="pt-template-gen-empty">
        <UiButton
          variant="primary"
          size="md"
          :disabled="isGenerating"
          @click="onGenerate"
        >
          {{ isGenerating ? '생성 중...' : '템플릿 생성 시작' }}
        </UiButton>
      </div>
    </template>

    <!-- 생성 완료 상태 -->
    <template v-else>
      <div class="pt-template-gen-layout">
        <!-- 좌측 패널: 현황 · 컬러 · 액션 -->
        <div class="pt-template-gen-left">
          <h3 class="pt-panel-title">템플릿 생성</h3>

          <!-- 생성 현황 pills -->
          <div class="pt-template-status-list">
            <div class="pt-template-status-item">
              <span class="pt-template-status-label">생성방식</span>
              <span class="pt-template-status-pill is-done">AI 생성</span>
            </div>
            <div class="pt-template-status-item">
              <span class="pt-template-status-label">헤더</span>
              <span
                :class="[
                  'pt-template-status-pill',
                  headerStatus === 'done' ? 'is-done' : headerStatus === 'fail' ? 'is-fail' : 'is-wait',
                ]"
              >
                {{ headerStatus === 'done' ? '완료' : headerStatus === 'fail' ? '실패' : '대기' }}
              </span>
            </div>
            <div class="pt-template-status-item">
              <span class="pt-template-status-label">푸터</span>
              <span
                :class="[
                  'pt-template-status-pill',
                  footerStatus === 'done' ? 'is-done' : footerStatus === 'fail' ? 'is-fail' : 'is-wait',
                ]"
              >
                {{ footerStatus === 'done' ? '완료' : footerStatus === 'fail' ? '실패' : '대기' }}
              </span>
            </div>
            <!-- 표지 상태 (TODO: 백엔드 연동 필요 - 실제 표지 생성 상태 코드로 교체) -->
            <div class="pt-template-status-item">
              <span class="pt-template-status-label">표지</span>
              <span class="pt-template-status-pill is-wait">미생성</span>
            </div>
          </div>

          <!-- 적용 컬러 스와치 -->
          <div
            v-if="templateColors"
            class="pt-template-colors"
          >
            <div class="pt-settings-label">적용 컬러</div>
            <div class="pt-template-color-swatches">
              <div
                class="pt-template-swatch"
                :style="{ background: templateColors.baseColor }"
                :title="'기본색: ' + templateColors.baseColor"
              />
              <div
                class="pt-template-swatch"
                :style="{ background: templateColors.accentColor }"
                :title="'강조색: ' + templateColors.accentColor"
              />
            </div>
          </div>

          <!-- 액션 버튼들 -->
          <div class="pt-template-gen-actions">
            <!-- 본문형: 템플릿 재생성 / 표지형: 표지 재생성 -->
            <template v-if="selectedLayoutType === 'body'">
              <UiButton
                variant="secondary"
                size="sm"
                :disabled="isGenerating"
                @click="onRegenerate"
              >
                {{ isGenerating ? '재생성 중...' : '템플릿 재생성' }}
              </UiButton>
            </template>
            <template v-else>
              <UiButton
                variant="secondary"
                size="sm"
                :disabled="isRegeneratingCover"
                @click="onRegenerateCover"
              >
                {{ isRegeneratingCover ? '재생성 중...' : '표지 재생성' }}
              </UiButton>
            </template>

            <UiButton
              variant="primary"
              size="md"
              :disabled="template?.genStatusCd !== '003' || isSaving"
              @click="onConfirm"
            >
              {{ isSaving ? '저장 중...' : '이 템플릿 확정 · 다음 진행' }}
              <template #icon-right>
                <i class="icon-arrow-right size-14" />
              </template>
            </UiButton>
          </div>
        </div>

        <!-- 중앙 패널: 미리보기 / 슬롯 편집 탭 -->
        <div class="pt-template-gen-center">
          <!-- 헤더 행: 레이아웃 토글(좌) + 미리보기/슬롯편집 탭(우) -->
          <div class="pt-template-center-head">
            <div class="pt-layout-toggle">
              <button
                :class="['pt-layout-toggle-btn', { 'is-active': selectedLayoutType === 'body' }]"
                @click="selectedLayoutType = 'body'"
              >
                본문형
              </button>
              <button
                :class="['pt-layout-toggle-btn', { 'is-active': selectedLayoutType === 'cover' }]"
                @click="selectedLayoutType = 'cover'"
              >
                표지형
              </button>
            </div>
            <!-- 슬롯 편집은 본문형만 — 표지형은 이미지 생성만 하므로 미리보기만 표시 -->
            <UiTab
              v-if="selectedLayoutType === 'body'"
              v-model="activeTab"
              :tabs="[
                { label: '미리보기', value: 'preview' },
                { label: '슬롯 편집', value: 'slots' },
              ]"
            />
          </div>

          <!-- 센터 패널 액션 바 -->
          <div class="pt-template-center-actions">
            <!-- 본문형 탭 -->
            <template v-if="selectedLayoutType === 'body'">
              <span :class="['pt-badge', template?.genStatusCd === '003' ? 'is-ok' : 'is-gray']">
                {{ template?.genStatusCd === '003' ? '완료' : '대기' }}
              </span>
            </template>
            <!-- 표지형 -->
            <template v-else>
              <UiButton
                variant="secondary"
                size="xs"
                :disabled="isRegeneratingCover"
                @click="onRegenerateCover"
              >
                {{ isRegeneratingCover ? '재생성 중...' : '↻ 표지 재생성' }}
              </UiButton>
            </template>
          </div>

          <!-- 미리보기 탭 -->
          <div
            v-if="activeTab === 'preview'"
            class="pt-template-preview"
            :style="selectedLayoutType === 'body' ? { aspectRatio: previewAspectRatio } : {}"
          >
            <!-- 본문형: 기존 헤더·본문·푸터 미리보기 (변경 없음) -->
            <template v-if="selectedLayoutType === 'body'">
              <!-- 헤더 미리보기 — editableSlotCssStyle 사용으로 위치·스타일 모두 동기화 -->
              <div
                class="pt-template-preview-header"
                :style="headerPreviewStyle"
              >
                <template v-if="editableHeaderSlots.length > 0">
                  <div
                    v-for="slot in editableHeaderSlots"
                    :key="slot.key"
                    class="pt-template-slot"
                    :style="editableSlotCssStyle(slot)"
                  >
                    <span v-if="slot.key !== 'divider'">{{ resolveSlotText(slot) }}</span>
                  </div>
                </template>
                <div
                  v-else
                  class="pt-template-preview-placeholder"
                >
                  헤더 생성 중...
                </div>
              </div>

              <!-- 본문 영역 더미 콘텐츠 (미리보기 전용, 저장 대상 아님) -->
              <div
                class="pt-template-preview-body"
                :style="dummyColorStyle"
              >
                <div class="pt-dummy-body">
                  <div class="pt-dummy-eyebrow">1. 사업이해도</div>
                  <div class="pt-dummy-title">과업 배경 및 추진 방향</div>
                  <div class="pt-dummy-grid">
                    <ul class="pt-dummy-list">
                      <li>핵심 요구사항 요약 문구가 이 위치에 표시됩니다</li>
                      <li>두 번째 항목 예시 텍스트입니다</li>
                      <li>세 번째 항목 예시 텍스트입니다</li>
                      <li>네 번째 항목 예시 텍스트입니다</li>
                    </ul>
                    <div>
                      <div class="pt-dummy-chart">
                        <div
                          class="pt-dummy-bar"
                          style="height: 40%"
                        />
                        <div
                          class="pt-dummy-bar is-accent"
                          style="height: 65%"
                        />
                        <div
                          class="pt-dummy-bar"
                          style="height: 52%"
                        />
                        <div
                          class="pt-dummy-bar is-accent"
                          style="height: 88%"
                        />
                        <div
                          class="pt-dummy-bar"
                          style="height: 70%"
                        />
                      </div>
                      <div class="pt-dummy-caption">연도별 처리 현황 (예시 데이터)</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 푸터 미리보기 — editableSlotCssStyle 사용으로 위치·스타일 모두 동기화 -->
              <div
                class="pt-template-preview-footer"
                :style="footerPreviewStyle"
              >
                <template v-if="editableFooterSlots.length > 0">
                  <div
                    v-for="slot in editableFooterSlots"
                    :key="slot.key"
                    class="pt-template-slot"
                    :style="editableSlotCssStyle(slot)"
                  >
                    <span>{{ resolveSlotText(slot) }}</span>
                  </div>
                </template>
                <div
                  v-else
                  class="pt-template-preview-placeholder"
                >
                  푸터 생성 중...
                </div>
              </div>
            </template>

            <!-- 표지형: CoverPreviewTab 컴포넌트로 위임 -->
            <CoverPreviewTab
              v-else
              :pt-project-id="props.ptProjectId"
              :model-id="props.modelId"
              :agent-id="props.agentId"
              :cover-image-path="template?.coverImagePath"
              :aspect-ratio="previewAspectRatio"
              @cover-updated="onCoverChatUpdated"
            />
          </div>

          <!-- 슬롯 편집 탭 — 본문형 WYSIWYG 에디터 (표지형은 이미지 생성이라 슬롯 편집 없음) -->
          <div
            v-else-if="selectedLayoutType === 'body'"
            class="pt-template-preview pt-template-editor"
            :style="{ aspectRatio: previewAspectRatio }"
          >
            <!-- 헤더 편집 영역 (미리보기와 동일한 크기·배경) -->
            <div
              ref="headerEditorRef"
              class="pt-template-preview-header"
              :style="headerPreviewStyle"
            >
              <template v-if="editableHeaderSlots.length > 0">
                <div
                  v-for="slot in editableHeaderSlots"
                  :key="slot.key"
                  :class="[
                    'pt-wysiwyg-slot',
                    {
                      'is-active': draggingKey === slot.key && draggingZone === 'header',
                      'is-selected': selectedKey === slot.key && selectedZone === 'header' && slot.key !== 'divider',
                      'is-divider': slot.key === 'divider',
                    },
                  ]"
                  :style="editableSlotCssStyle(slot)"
                  @mousedown.prevent="onSlotMouseDown($event, slot.key, 'header')"
                >
                  <template v-if="slot.key !== 'divider'">
                    <span
                      class="pt-wysiwyg-text"
                      contenteditable="true"
                      @focus="onTextFocus($event, slot, 'header')"
                      @blur="onTextBlur($event, slot.key, 'header')"
                      @mousedown.stop
                      @keydown.enter.prevent
                      >{{ resolveSlotText(slot) }}</span
                    >
                  </template>
                </div>
              </template>
              <div
                v-else
                class="pt-template-preview-placeholder"
              >
                헤더 슬롯이 없습니다.
              </div>
            </div>

            <!-- 본문 영역 더미 콘텐츠 (편집 불가, 미리보기와 동일) -->
            <div
              class="pt-template-preview-body"
              :style="dummyColorStyle"
            >
              <div class="pt-dummy-body">
                <div class="pt-dummy-eyebrow">1. 사업이해도</div>
                <div class="pt-dummy-title">과업 배경 및 추진 방향</div>
                <div class="pt-dummy-grid">
                  <ul class="pt-dummy-list">
                    <li>핵심 요구사항 요약 문구가 이 위치에 표시됩니다</li>
                    <li>두 번째 항목 예시 텍스트입니다</li>
                    <li>세 번째 항목 예시 텍스트입니다</li>
                    <li>네 번째 항목 예시 텍스트입니다</li>
                  </ul>
                  <div>
                    <div class="pt-dummy-chart">
                      <div
                        class="pt-dummy-bar"
                        style="height: 40%"
                      />
                      <div
                        class="pt-dummy-bar is-accent"
                        style="height: 65%"
                      />
                      <div
                        class="pt-dummy-bar"
                        style="height: 52%"
                      />
                      <div
                        class="pt-dummy-bar is-accent"
                        style="height: 88%"
                      />
                      <div
                        class="pt-dummy-bar"
                        style="height: 70%"
                      />
                    </div>
                    <div class="pt-dummy-caption">연도별 처리 현황 (예시 데이터)</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 푸터 편집 영역 (미리보기와 동일한 크기·배경) -->
            <div
              ref="footerEditorRef"
              class="pt-template-preview-footer"
              :style="footerPreviewStyle"
            >
              <template v-if="editableFooterSlots.length > 0">
                <div
                  v-for="slot in editableFooterSlots"
                  :key="slot.key"
                  :class="[
                    'pt-wysiwyg-slot',
                    {
                      'is-active': draggingKey === slot.key && draggingZone === 'footer',
                      'is-selected': selectedKey === slot.key && selectedZone === 'footer',
                    },
                  ]"
                  :style="editableSlotCssStyle(slot)"
                  @mousedown.prevent="onSlotMouseDown($event, slot.key, 'footer')"
                >
                  <span
                    class="pt-wysiwyg-text"
                    contenteditable="true"
                    @focus="onTextFocus($event, slot, 'footer')"
                    @blur="onTextBlur($event, slot.key, 'footer')"
                    @mousedown.stop
                    @keydown.enter.prevent
                    >{{ resolveSlotText(slot) }}</span
                  >
                </div>
              </template>
              <div
                v-else
                class="pt-template-preview-placeholder"
              >
                푸터 슬롯이 없습니다.
              </div>
            </div>
          </div>

          <!-- 슬롯 스타일 편집 패널 — 본문형 슬롯 편집 탭에서만 표시 -->
          <Transition name="pt-style-panel">
            <div
              v-if="
                activeTab === 'slots' && selectedLayoutType === 'body' && selectedSlot && selectedSlot.key !== 'divider'
              "
              class="pt-slot-style-panel"
            >
              <span class="pt-slot-style-panel-title">스타일 편집</span>

              <div class="pt-slot-style-panel-row">
                <span class="pt-slot-style-panel-key">크기</span>
                <div class="pt-slot-style-panel-ctrl">
                  <input
                    class="pt-slot-style-number-input"
                    :value="selectedSlot.fontSize ?? 13"
                    @change="
                      (e) => updateSelectedSlotStyle({ fontSize: parseInt((e.target as HTMLInputElement).value) || 13 })
                    "
                  />
                  <span class="pt-slot-style-panel-unit">px</span>
                </div>
              </div>

              <div class="pt-slot-style-panel-row">
                <span class="pt-slot-style-panel-key">굵기</span>
                <button
                  :class="[
                    'pt-slot-style-weight-btn',
                    { 'is-active': selectedSlot.fontWeight === 'bold' || selectedSlot.fontWeight === '700' },
                  ]"
                  @click="
                    updateSelectedSlotStyle({
                      fontWeight:
                        selectedSlot.fontWeight === 'bold' || selectedSlot.fontWeight === '700' ? 'normal' : 'bold',
                    })
                  "
                >
                  B
                </button>
              </div>

              <div class="pt-slot-style-panel-row">
                <span class="pt-slot-style-panel-key">색상</span>
                <div class="pt-slot-style-panel-ctrl">
                  <input
                    type="color"
                    class="pt-slot-style-color-input"
                    :value="selectedSlot.color ?? '#333333'"
                    @input="(e) => updateSelectedSlotStyle({ color: (e.target as HTMLInputElement).value })"
                  />
                  <span class="pt-slot-style-panel-color-val">{{ selectedSlot.color ?? '#333333' }}</span>
                </div>
              </div>

              <button
                class="pt-slot-style-panel-close"
                @click="selectedKey = null"
              >
                <i class="icon-close size-12" />
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { openToast } from '~/composables/useToast'
import type { PtTemplate } from '~/types/proposal'
import CoverPreviewTab from './cover/CoverPreviewTab.vue'

const props = defineProps<{
  ptProjectId: string
  modelId: string
  agentId: string
  projectNm?: string
  orgNm?: string
  companyNm?: string
  submissionDate?: string
  /** "169"=16:9, "43"=4:3, "a4"=A4 세로  */
  docSize?: '169' | '43' | 'a4'
}>()

const emit = defineEmits<{
  next: []
}>()

const {
  fetchSelectPtTemplate,
  fetchGeneratePtTemplate,
  fetchRegeneratePtTemplate,
  fetchUpdatePtTemplate,
  fetchGeneratePtCoverImage,
} = useProposalApi()

// ── 탭 / 로딩 상태 ─────────────────────────────────────────────────────────────

const template = ref<PtTemplate | null>(null)
const activeTab = ref<'preview' | 'slots'>('preview')
const selectedLayoutType = ref<'body' | 'cover'>('body')
const isGenerating = ref(false)
const isSaving = ref(false)

const isRegeneratingCover = ref(false)

const onRegenerateCover = async () => {
  isRegeneratingCover.value = true
  try {
    const res = await fetchGeneratePtCoverImage(props.ptProjectId, props.agentId)
    if (res.result === 'OK') {
      template.value = res.data
    } else {
      openToast({ message: res.msg ?? '표지 이미지 생성에 실패했습니다.', type: 'error' })
    }
  } catch {
    openToast({ message: '표지 이미지 생성 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isRegeneratingCover.value = false
  }
}

const onCoverChatUpdated = (coverImagePath: string) => {
  if (!template.value) return
  template.value = { ...template.value, coverImagePath }
}

// ── 파생 상태 ─────────────────────────────────────────────────────────────────

interface TemplateSlot {
  key: string
  placeholder?: string
  type?: string
  thickness?: number
  fontSize?: number
  fontWeight?: string
  color?: string
  bgColor?: string
  align?: string
  borderRadius?: number
}

interface ColorJson {
  baseColor: string
  accentColor: string
}

const templateColors = computed<ColorJson | null>(() => {
  if (!template.value?.colorJson) return null
  try {
    return JSON.parse(template.value.colorJson)
  } catch {
    return null
  }
})

// 더미 본문 콘텐츠에 실제 확정 컬러를 CSS 변수로 주입
const dummyColorStyle = computed(() => ({
  '--base-color': templateColors.value?.baseColor ?? '#1a237e',
  '--accent-color': templateColors.value?.accentColor ?? '#E08A2C',
}))

// CSS 변수를 실제 컬러 값으로 치환
const resolveColor = (val: string | undefined): string | undefined => {
  if (!val) return undefined
  if (val === 'var(--accent-color)') return templateColors.value?.accentColor ?? val
  if (val === 'var(--base-color)') return templateColors.value?.baseColor ?? val
  return val
}

interface ComponentEntry {
  text?: string
  type?: string
  x?: number
  y?: number
  style?: {
    fontSize?: number
    fontWeight?: string
    color?: string
    bg?: string
    align?: string
    borderRadius?: number
    thickness?: number
  }
}

const headerStatus = computed(() => {
  if (!template.value) return 'wait'
  if (template.value.genStatusCd === '003' && template.value.headerComponentsJson) return 'done'
  if (template.value.genStatusCd === '004') return 'fail'
  return 'wait'
})

const footerStatus = computed(() => {
  if (!template.value) return 'wait'
  if (template.value.genStatusCd === '003' && template.value.footerComponentsJson) return 'done'
  if (template.value.genStatusCd === '004') return 'fail'
  return 'wait'
})

/**
 * docSize별 슬라이드 원본 해상도 (pt 단위)
 *   "169" → 720×405  (16:9)
 *   "43"  → 720×540  (4:3)
 *   "a4"  → 595×842  (A4 세로)
 *
 * 헤더: 슬라이드 높이의 9%
 * 푸터: 슬라이드 높이의 5%
 * 미리보기 컨테이너 너비는 CSS로 고정, 높이만 aspect-ratio로 결정
 */
const slideSpec = computed(() => {
  switch (props.docSize) {
    case 'a4':
      return { w: 595, h: 842, ratio: 595 / 842 }
    case '43':
      return { w: 720, h: 540, ratio: 720 / 540 }
    default:
      return { w: 720, h: 405, ratio: 720 / 405 } // '169' 기본
  }
})

/** 미리보기 컨테이너 aspect-ratio (CSS) */
const previewAspectRatio = computed(() => {
  const { w, h } = slideSpec.value
  return `${w} / ${h}`
})

/** 헤더 높이 비율 (슬라이드 높이의 9%) — CSS percent */
const headerHeightPct = 9 // %
const footerHeightPct = 5 // %

const headerPreviewStyle = computed(() => ({
  height: `${headerHeightPct}%`,
  position: 'relative' as const,
  background: '#fff',
  borderBottom: '1px solid #e0e0e0',
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  gap: '8px',
  flexWrap: 'wrap' as const,
  flexShrink: '0',
}))

const footerPreviewStyle = computed(() => ({
  height: `${footerHeightPct}%`,
  position: 'relative' as const,
  background: '#f8f9fa',
  borderTop: '1px solid #e0e0e0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  flexShrink: '0',
}))

// ── 슬롯 텍스트 바인딩 (예시 값으로 치환) ─────────────────────────────────────

// 실제 프로젝트 정보를 예시값에 반영 (props 연동)
const exampleValues = computed<Record<string, string>>(() => ({
  '{chapter_no}': 'Ⅱ',
  '{project_nm}': props.projectNm || '스마트 공공서비스 구축 사업',
  '{chapter_title}': '기술 제안',
  '{breadcrumb}': '1. 사업이해도',
  '{page_number}': 'Ⅱ-1',
  '{org_nm}': props.orgNm || '○○청',
  '{submitter_nm}': '(주)제안사',
}))

const FOOTER_TYPE_LABELS: Record<string, string> = {
  org_name: '○○청',
  page_number: 'Ⅱ-1',
  company_name: '(주)제안사',
}

// TemplateSlot(미리보기)과 EditableSlot(WYSIWYG 편집기) 모두 처리
// - TemplateSlot: placeholder 필드에 변수명({project_nm} 등) 보유
// - EditableSlot : text 필드에 동일 값 보유 (placeholder 없음 → slot.key 노출 버그 방지)
const resolveSlotText = (slot: TemplateSlot | EditableSlot): string => {
  if (slot.type) return FOOTER_TYPE_LABELS[slot.type] ?? slot.type
  const raw = (slot as TemplateSlot).placeholder ?? (slot as EditableSlot).text ?? ''
  if (!raw) return slot.key
  return exampleValues.value[raw] ?? raw
}

// ── WYSIWYG 편집기 상태 ────────────────────────────────────────────────────────

interface EditableSlot {
  key: string
  text: string
  x: number // % 단위
  y: number // % 단위
  type?: string
  fontSize?: number
  fontWeight?: string
  color?: string
  bgColor?: string
  align?: string
  borderRadius?: number
  thickness?: number
}

const headerEditorRef = ref<HTMLElement | null>(null)
const footerEditorRef = ref<HTMLElement | null>(null)
const editableHeaderSlots = ref<EditableSlot[]>([])
const editableFooterSlots = ref<EditableSlot[]>([])

// 드래그 상태
const draggingKey = ref<string | null>(null)
const draggingZone = ref<'header' | 'footer' | null>(null)
const dragStartMouse = ref({ x: 0, y: 0 })
const dragStartSlot = ref({ x: 0, y: 0 })

// 선택 상태 (스타일 패널 표시 대상)
const selectedKey = ref<string | null>(null)
const selectedZone = ref<'header' | 'footer' | null>(null)

const selectedSlot = computed<EditableSlot | null>(() => {
  if (!selectedKey.value || !selectedZone.value) return null
  const slots = selectedZone.value === 'header' ? editableHeaderSlots.value : editableFooterSlots.value
  return slots.find((s) => s.key === selectedKey.value) ?? null
})

// ── 기본 위치 계산 (kac_proposal_chapter_template.html 레이아웃 기반) ──────────

/**
 * 헤더 슬롯 기본 x 위치 — 아이템을 가로로 균등 분배
 * 미리보기의 flex 레이아웃과 시각적으로 동일하게 맞추기 위해
 * 모든 아이템을 같은 행에 배치하고 x만 분산
 */
const getDefaultHeaderX = (key: string, idx: number, total: number = 4): number => {
  if (key === 'divider') return 0
  if (total <= 1) return 2
  // 배지(idx=0): 왼쪽 / 나머지: 간격 두고 배치
  const positions: Record<number, number[]> = {
    2: [2, 50],
    3: [2, 35, 68],
    4: [2, 22, 48, 72],
    5: [2, 20, 40, 60, 78],
  }
  return (positions[total] ?? positions[4])[idx] ?? Math.round(2 + (idx / (total - 1)) * 86)
}

/**
 * 헤더 슬롯 기본 y 위치
 * 캔버스 height=64px 기준 단일 행 수직 중앙: y=35%
 */
const getDefaultHeaderY = (key: string): number => {
  if (key === 'divider') return 88
  return 35 // 64px 캔버스에서 ~22px 위쪽 = 시각적 수직 중앙
}

/**
 * 푸터 슬롯 기본 x 위치: 3개 기준 좌·중·우
 */
const getDefaultFooterX = (idx: number, total: number): number => {
  if (total <= 1) return 2
  if (total === 2) return [2, 80][idx] ?? 2
  if (total === 3) return [2, 44, 82][idx] ?? 2
  return Math.round(2 + (idx / (total - 1)) * 88)
}

// ── JSON 파싱 (body/cover 구조 + 레거시 하위호환) ────────────────────────────

const parseLayoutAwareJson = (
  raw: string | null | undefined,
): { body: Record<string, ComponentEntry>; cover: Record<string, ComponentEntry> } => {
  if (!raw) return { body: {}, cover: {} }
  try {
    const json = JSON.parse(raw) as Record<string, unknown>
    if ('body' in json || 'cover' in json) {
      return {
        body: (json.body as Record<string, ComponentEntry>) ?? {},
        cover: (json.cover as Record<string, ComponentEntry>) ?? {},
      }
    }
    // 레거시: 최상위 객체 전체를 body로 취급, cover는 빈 객체
    return { body: json as Record<string, ComponentEntry>, cover: {} }
  } catch {
    return { body: {}, cover: {} }
  }
}

// ── 편집 가능 슬롯 초기화 ─────────────────────────────────────────────────────

const initEditableSlots = () => {
  // 레이아웃 전환·재생성 시 선택 초기화
  selectedKey.value = null
  selectedZone.value = null

  // 헤더
  const headerParsed = parseLayoutAwareJson(template.value?.headerComponentsJson)
  const headerEntries = Object.entries(headerParsed[selectedLayoutType.value])
  editableHeaderSlots.value = headerEntries.map(([key, val], idx) => ({
    key,
    text: val.text ?? '',
    x: val.x ?? getDefaultHeaderX(key, idx, headerEntries.length),
    y: val.y ?? getDefaultHeaderY(key),
    type: val.type,
    fontSize: val.style?.fontSize,
    fontWeight: val.style?.fontWeight,
    color: resolveColor(val.style?.color),
    bgColor: resolveColor(val.style?.bg),
    align: val.style?.align,
    borderRadius: val.style?.borderRadius,
    thickness: val.style?.thickness,
  }))

  // 푸터
  const footerParsed = parseLayoutAwareJson(template.value?.footerComponentsJson)
  const footerEntries = Object.entries(footerParsed[selectedLayoutType.value])
  editableFooterSlots.value = footerEntries.map(([key, val], idx) => ({
    key,
    text: val.text ?? '',
    x: val.x ?? getDefaultFooterX(idx, footerEntries.length),
    y: val.y ?? 30,
    type: val.type,
    fontSize: val.style?.fontSize,
    fontWeight: val.style?.fontWeight,
    color: resolveColor(val.style?.color),
    bgColor: resolveColor(val.style?.bg),
    align: val.style?.align,
    borderRadius: val.style?.borderRadius,
  }))
}

// template 또는 selectedLayoutType 변경 시 editable 슬롯 재초기화
watch([template, selectedLayoutType], () => {
  initEditableSlots()
})

// 표지형은 슬롯 편집이 없으므로 미리보기로 되돌림
watch(selectedLayoutType, (type) => {
  if (type === 'cover') activeTab.value = 'preview'
})

// ── WYSIWYG CSS 스타일 ────────────────────────────────────────────────────────

const editableSlotCssStyle = (slot: EditableSlot) => {
  if (slot.key === 'divider') {
    return {
      position: 'absolute' as const,
      left: `${slot.x}%`,
      top: `${slot.y}%`,
      width: '100%',
      height: `${slot.thickness ?? 1}px`,
      background: slot.bgColor ?? templateColors.value?.accentColor ?? '#E08A2C',
      cursor: 'ns-resize',
    }
  }
  return {
    position: 'absolute' as const,
    left: `${slot.x}%`,
    top: `${slot.y}%`,
    fontSize: slot.fontSize ? `${slot.fontSize}px` : '10px',
    fontWeight: slot.fontWeight ?? 'normal',
    color: slot.color ?? '#333',
    background: slot.bgColor,
    borderRadius: slot.borderRadius ? `${slot.borderRadius}px` : undefined,
  }
}

// ── 드래그 이벤트 핸들러 ──────────────────────────────────────────────────────

const updateSelectedSlotStyle = (patch: Partial<EditableSlot>) => {
  if (!selectedKey.value || !selectedZone.value) return
  const slots = selectedZone.value === 'header' ? editableHeaderSlots.value : editableFooterSlots.value
  const slot = slots.find((s) => s.key === selectedKey.value)
  if (slot) Object.assign(slot, patch)
}

const onSlotMouseDown = (e: MouseEvent, key: string, zone: 'header' | 'footer') => {
  // 클릭한 슬롯을 선택 (스타일 패널 표시)
  selectedKey.value = key
  selectedZone.value = zone
  draggingKey.value = key
  draggingZone.value = zone
  dragStartMouse.value = { x: e.clientX, y: e.clientY }

  const slots = zone === 'header' ? editableHeaderSlots.value : editableFooterSlots.value
  const slot = slots.find((s) => s.key === key)
  if (slot) dragStartSlot.value = { x: slot.x, y: slot.y }

  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

const onDragMove = (e: MouseEvent) => {
  if (!draggingKey.value || !draggingZone.value) return

  const editorEl = draggingZone.value === 'header' ? headerEditorRef.value : footerEditorRef.value
  if (!editorEl) return

  const rect = editorEl.getBoundingClientRect()
  const dx = ((e.clientX - dragStartMouse.value.x) / rect.width) * 100
  const dy = ((e.clientY - dragStartMouse.value.y) / rect.height) * 100

  const slots = draggingZone.value === 'header' ? editableHeaderSlots.value : editableFooterSlots.value
  const slot = slots.find((s) => s.key === draggingKey.value)
  if (slot) {
    slot.x = Math.max(0, Math.min(90, dragStartSlot.value.x + dx))
    slot.y = Math.max(0, Math.min(90, dragStartSlot.value.y + dy))
  }
}

const onDragEnd = () => {
  draggingKey.value = null
  draggingZone.value = null
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

// ── 텍스트 인라인 편집 ────────────────────────────────────────────────────────

/**
 * focus 시 raw 값 표시 (placeholder 포함)
 * blur 시 resolveSlotText(예시값)로 복원
 */
const onTextFocus = (e: FocusEvent, slot: EditableSlot, zone: 'header' | 'footer') => {
  const target = e.target as HTMLElement
  // 포커스 시 화면에 보이던 값 그대로 유지 (raw 변수명 노출 방지)
  target.innerText = resolveSlotText(slot)
  // 텍스트 클릭 시 @mousedown.stop으로 onSlotMouseDown이 막히므로, 여기서 선택 상태 설정
  selectedKey.value = slot.key
  selectedZone.value = zone
}

const onTextBlur = (e: Event, key: string, zone: 'header' | 'footer') => {
  const target = e.target as HTMLElement
  const newText = target.innerText.trim()
  const slots = zone === 'header' ? editableHeaderSlots.value : editableFooterSlots.value
  const slot = slots.find((s) => s.key === key)
  if (slot) {
    // 빈 값이면 기존 유지, 아니면 사용자가 입력한 텍스트를 그대로 저장
    if (newText) slot.text = newText
    // blur 후에도 동일한 값 표시 (resolveSlotText가 slot.text를 그대로 반환)
    target.innerText = resolveSlotText(slot)
  }
}

// ── 확정 저장 ─────────────────────────────────────────────────────────────────

/**
 * 편집된 슬롯을 레이아웃 타입별 객체로 조립 (JSON.stringify는 호출부에서)
 */
const buildUpdatedJson = (slots: EditableSlot[]): Record<string, unknown> => {
  const json: Record<string, unknown> = {}
  slots.forEach((slot) => {
    json[slot.key] = {
      text: slot.text,
      type: slot.type,
      x: Math.round(slot.x),
      y: Math.round(slot.y),
      style: {
        fontSize: slot.fontSize,
        fontWeight: slot.fontWeight,
        color: slot.color,
        bg: slot.bgColor,
        align: slot.align,
        borderRadius: slot.borderRadius,
        thickness: slot.thickness,
      },
    }
  })
  return json
}

const onConfirm = async () => {
  if (!template.value) return
  isSaving.value = true
  try {
    // 편집하지 않은 레이아웃 타입의 기존 데이터를 보존한 채 병합 저장
    const existingHeader = parseLayoutAwareJson(template.value.headerComponentsJson)
    const existingFooter = parseLayoutAwareJson(template.value.footerComponentsJson)

    const mergedHeader = {
      ...existingHeader,
      [selectedLayoutType.value]: buildUpdatedJson(editableHeaderSlots.value),
    }
    const mergedFooter = {
      ...existingFooter,
      [selectedLayoutType.value]: buildUpdatedJson(editableFooterSlots.value),
    }

    const res = await fetchUpdatePtTemplate(
      props.ptProjectId,
      JSON.stringify(mergedHeader),
      JSON.stringify(mergedFooter),
      template.value.colorJson ?? '{}',
      '', // modifyUserId — 서버에서 세션으로 처리
    )
    if (res.result === 'OK') {
      emit('next')
    } else {
      openToast({ message: res.msg ?? '템플릿 저장에 실패했습니다.', type: 'error' })
    }
  } catch {
    openToast({ message: '저장 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isSaving.value = false
  }
}

// ── API 호출 ──────────────────────────────────────────────────────────────────

const onGenerate = async () => {
  isGenerating.value = true
  try {
    const res = await fetchGeneratePtTemplate(props.ptProjectId, props.modelId, props.agentId)
    if (res.result === 'OK') {
      template.value = res.data
    } else {
      openToast({ message: res.msg ?? '템플릿 생성에 실패했습니다.', type: 'error' })
    }
  } catch {
    openToast({ message: '템플릿 생성 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isGenerating.value = false
  }
}

const onRegenerate = async () => {
  isGenerating.value = true
  try {
    const res = await fetchRegeneratePtTemplate(props.ptProjectId, '', props.modelId, props.agentId)
    if (res.result === 'OK') {
      template.value = res.data
    } else {
      openToast({ message: res.msg ?? '재생성에 실패했습니다.', type: 'error' })
    }
  } catch {
    openToast({ message: '재생성 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isGenerating.value = false
  }
}

// ── 초기 로드 ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const res = await fetchSelectPtTemplate(props.ptProjectId)
    if (res.result === 'OK' && res.data) {
      template.value = res.data
    }
  } catch {
    // 없으면 null 유지 (초기 상태)
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
})
</script>
