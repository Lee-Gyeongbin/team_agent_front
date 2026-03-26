<template>
  <div class="chat-guide-panel">
    <div class="chat-guide-section-header">
      <h3 class="chat-guide-section-title">점검 및 장애 안내</h3>
      <div class="chat-guide-setting-footer">
        <UiButton
          variant="primary"
          :disabled="isLoading"
          @click="onSave"
        >
          저장
        </UiButton>
        <UiButton
          variant="outline"
          :disabled="isLoading"
          @click="onReset"
        >
          초기화
        </UiButton>
      </div>
    </div>

    <UiLoading
      v-if="isLoading"
      overlay
      :text="loadingText"
    />

    <UiEmpty
      v-else-if="isError"
      :title="errorTitle"
      :description="errorMessage"
    >
      <UiButton
        size="sm"
        variant="secondary"
        @click="handleLoad"
      >
        다시 시도
      </UiButton>
    </UiEmpty>

    <div
      v-else
      class="maint-body"
    >
      <!-- 긴급 공지 -->
      <section
        class="maint-section"
        :class="{ 'is-emergency': emergencyRow.enblYn === 'Y' }"
      >
        <div class="maint-section-header">
          <div class="maint-section-title-area">
            <span class="maint-section-icon">⚠️</span>
            <div>
              <h4 class="maint-section-title">긴급 공지</h4>
              <p class="maint-section-desc">즉시 표시되어야 하는 긴급 상황 안내</p>
            </div>
          </div>
          <UiToggle
            :model-value="emergencyRow.enblYn === 'Y'"
            @update:model-value="(v) => (emergencyRow.enblYn = toYn(v))"
          />
        </div>

        <template v-if="emergencyRow.enblYn === 'Y'">
          <div class="maint-alert-banner">⚠️ 긴급 공지가 활성화되면 사용자가 챗봇에 접속할 때 가장 먼저 표시됩니다</div>

          <div class="maint-field">
            <label class="maint-label">공지 제목</label>
            <UiInput
              v-model="emergencyRow.title"
              placeholder="예: 긴급 점검 안내"
              size="sm"
            />
          </div>

          <div class="maint-field">
            <label class="maint-label">공지 내용</label>
            <UiTextarea
              v-model="emergencyRow.content"
              :rows="4"
              border
              placeholder="긴급 공지 내용을 입력하세요"
            />
          </div>

          <div class="maint-field-row">
            <div class="maint-field">
              <label class="maint-label">표시 시작</label>
              <UiDatePicker
                v-model="emergencyStartDt"
                type="datetime"
              />
            </div>
            <div class="maint-field">
              <label class="maint-label">표시 종료</label>
              <UiDatePicker
                v-model="emergencyEndDt"
                type="datetime"
              />
            </div>
          </div>
        </template>
      </section>

      <!-- 정기 점검 안내 -->
      <section class="maint-section">
        <div class="maint-section-header">
          <div class="maint-section-title-area">
            <span class="maint-section-icon">🔧</span>
            <div>
              <h4 class="maint-section-title">정기 점검 안내</h4>
              <p class="maint-section-desc">예정된 시스템 점검 사전 안내</p>
            </div>
          </div>
          <UiToggle
            :model-value="scheduledRow.enblYn === 'Y'"
            @update:model-value="(v) => (scheduledRow.enblYn = toYn(v))"
          />
        </div>

        <template v-if="scheduledRow.enblYn === 'Y'">
          <div class="maint-field">
            <label class="maint-label">점검 일시</label>
            <div class="maint-field-row">
              <UiDatePicker
                v-model="scheduledStartDt"
                type="datetime"
              />
              <UiDatePicker
                v-model="scheduledEndDt"
                type="datetime"
              />
            </div>
          </div>

          <div class="maint-field">
            <label class="maint-label">안내 메시지</label>
            <UiTextarea
              v-model="scheduledRow.content"
              :rows="4"
              border
            />
          </div>

          <div class="maint-field">
            <label class="maint-label">사전 안내 기간</label>
            <UiSelect
              v-model="scheduledRow.advanceNoticeCd"
              :options="advanceNoticeOptions"
              size="sm"
            />
          </div>
        </template>
      </section>

      <!-- 장애 발생 안내 -->
      <section class="maint-section">
        <div class="maint-section-header">
          <div class="maint-section-title-area">
            <span class="maint-section-icon">🚨</span>
            <div>
              <h4 class="maint-section-title">장애 발생 안내</h4>
              <p class="maint-section-desc">예상치 못한 장애 발생 시 표시</p>
            </div>
          </div>
          <UiToggle v-model="incidentSectionOn" />
        </div>

        <template v-if="incidentSectionOn">
          <div class="maint-field">
            <label class="maint-label">장애 유형별 메시지</label>
          </div>

          <div
            v-for="slot in CHAT_GUIDE_MAINTENANCE_INCIDENT_UI_SLOTS"
            :key="slot.guideKey"
            class="maint-incident-item"
          >
            <h5 class="maint-incident-item-title">
              <span>{{ slot.icon }}</span>
              {{ slot.label }}
            </h5>
            <UiTextarea
              v-model="rowByGuideKey(slot.guideKey).content"
              :rows="3"
              border
            />
          </div>
        </template>
      </section>

      <!-- 서비스 복구 안내 -->
      <section class="maint-section">
        <div class="maint-section-header">
          <div class="maint-section-title-area">
            <span class="maint-section-icon">✅</span>
            <div>
              <h4 class="maint-section-title">서비스 복구 안내</h4>
              <p class="maint-section-desc">점검/장애 종료 후 정상화 안내</p>
            </div>
          </div>
          <UiToggle
            :model-value="recoveryRow.enblYn === 'Y'"
            @update:model-value="(v) => (recoveryRow.enblYn = toYn(v))"
          />
        </div>

        <template v-if="recoveryRow.enblYn === 'Y'">
          <div class="maint-field">
            <label class="maint-label">복구 완료 메시지</label>
            <UiTextarea
              v-model="recoveryRow.content"
              :rows="4"
              border
            />
          </div>

          <UiCheckbox
            :model-value="recoveryRow.autoDsplYn === 'Y'"
            label="복구 완료 후 자동으로 표시 (24시간)"
            @update:model-value="(v) => (recoveryRow.autoDsplYn = toYn(v))"
          />
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { CodeItem } from '~/types/codes'
import type { ChatGuideMaintenanceItem } from '~/types/chat-guide'
import { CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS, CHAT_GUIDE_MAINTENANCE_INCIDENT_UI_SLOTS } from '~/types/chat-guide'
import { computed, onMounted, ref, type ComputedRef } from 'vue'
import { apiStringFromDateValue, dateValueFromApiString } from '~/utils/global/dateUtil'
import { toYn, useChatGuideStore } from '~/composables/chat-guide/useChatGuideStore'

const { localMaintenanceList, handleSelectMaintenance, handleSaveMaintenance } = useChatGuideStore()

/** 사전 안내 기간 셀렉트 옵션 (공통코드 GI000002) */
const advanceNoticeOptions = ref<{ label: string; value: string }[]>([])
const initAdvanceNoticeOptions = async () => {
  const codes = await getCodes('GI000002')
  advanceNoticeOptions.value = codes.map((item: CodeItem) => ({
    label: item.codeNm,
    value: item.codeId,
  }))
}

/** guideKey로 점검/장애 행 조회 */
const rowByGuideKey = (guideKey: string): ChatGuideMaintenanceItem => {
  const row = localMaintenanceList.value.find((row) => row.guideKey === guideKey)
  if (!row) {
    throw new Error(`점검/장애 guideKey 행이 없습니다: ${guideKey}`)
  }
  return row
}

const emergencyRow = computed(() => rowByGuideKey(CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.emergency))
const scheduledRow = computed(() => rowByGuideKey(CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.scheduled))
const recoveryRow = computed(() => rowByGuideKey(CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.recovery))

/** 점검 행 startDt/endDt ↔ DatePicker 바인딩 */
const maintenanceDateComputed = (row: ComputedRef<ChatGuideMaintenanceItem>, field: 'startDt' | 'endDt') =>
  computed({
    get: () => dateValueFromApiString(row.value[field]),
    set: (v: DateValue | undefined) => {
      row.value[field] = apiStringFromDateValue(v)
    },
  })

const emergencyStartDt = maintenanceDateComputed(emergencyRow, 'startDt')
const emergencyEndDt = maintenanceDateComputed(emergencyRow, 'endDt')
const scheduledStartDt = maintenanceDateComputed(scheduledRow, 'startDt')
const scheduledEndDt = maintenanceDateComputed(scheduledRow, 'endDt')

/** 장애 유형 섹션 토글 (동일 enblYn 유지) */
const incidentSectionOn = computed({
  get: () => rowByGuideKey(CHAT_GUIDE_MAINTENANCE_DEFAULT_GUIDE_KEYS.incidentSystem).enblYn === 'Y',
  set: (v) => {
    const yn = toYn(v)
    for (const slot of CHAT_GUIDE_MAINTENANCE_INCIDENT_UI_SLOTS) {
      rowByGuideKey(slot.guideKey).enblYn = yn
    }
  },
})

const { isLoading, loadingText } = useLoadingState()
const isError = ref(false)
const errorMessage = ref('')
const errorTitle = ref('불러오기 실패')

const handleLoad = async () => {
  openLoading({ text: '점검/장애 안내를 불러오는 중...' })
  isError.value = false
  errorMessage.value = ''
  try {
    await initAdvanceNoticeOptions()
    await handleSelectMaintenance()

    const defaultAdvanceNotice = advanceNoticeOptions.value[0]?.value
    if (defaultAdvanceNotice && !scheduledRow.value.advanceNoticeCd) {
      scheduledRow.value.advanceNoticeCd = defaultAdvanceNotice
    }
  } catch (err) {
    isError.value = true
    errorMessage.value =
      err instanceof Error && err.message
        ? `점검/장애 안내를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. (${err.message})`
        : '점검/장애 안내를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    closeLoading()
  }
}

const onSave = async () => {
  const confirmed = await openConfirm({
    title: '점검/장애 안내 저장',
    message: '변경된 점검/장애 안내 내용을 저장하시겠습니까?',
  })
  if (!confirmed) return

  try {
    await handleSaveMaintenance(localMaintenanceList.value)
    openToast({ message: '저장되었습니다.', type: 'success' })
  } catch (err) {
    openToast({
      message:
        err instanceof Error && err.message
          ? `점검/장애 안내 저장에 실패했습니다. 잠시 후 다시 시도해 주세요. (${err.message})`
          : '점검/장애 안내 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      type: 'error',
    })
  }
}

const onReset = async () => {
  const confirmed = await openConfirm({
    title: '점검/장애 안내 초기화',
    message:
      '초기화 시 변경된 점검/장애 안내 내용은 저장되지 않고, 이전에 저장된 값으로 다시 불러옵니다. 계속하시겠습니까?',
  })
  if (!confirmed) return

  try {
    await handleLoad()
    openToast({ message: '점검/장애 안내가 초기화되었습니다.', type: 'info' })
  } catch {
    // handleLoad에서 UI로 에러 처리
  }
}

onMounted(() => {
  handleLoad()
})
</script>
