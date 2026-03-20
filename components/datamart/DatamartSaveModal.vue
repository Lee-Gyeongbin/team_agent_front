<template>
  <UiModal
    :is-open="isOpen"
    :title="isEditMode ? '데이터마트 수정' : '데이터마트 추가'"
    max-width="720px"
    custom-class="datamart-save-modal"
    show-fullscreen
    @close="$emit('close')"
  >
    <div class="datamart-save-form com-setting-form">
      <!-- 기본 정보 -->
      <div
        class="com-setting-section"
        :class="{ 'is-collapsed': sectionCollapsed[0] }"
        style="--label-width: 100px"
      >
        <div
          class="com-setting-section-header"
          @click="sectionCollapsed[0] = !sectionCollapsed[0]"
        >
          <span class="com-setting-section-title">기본 정보</span>
          <i class="icon-chevron-down size-16 com-setting-section-arrow" />
        </div>
        <div class="com-setting-section-body">
          <div class="com-setting-field-row">
            <label class="com-setting-label">
              <span class="is-required">*</span>
              데이터마트명
            </label>
            <UiInput
              ref="dmNmRef"
              v-model="formData.dmNm"
              placeholder="예: 경영 통계 데이터마트"
              size="sm"
            />
          </div>
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">설명</label>
            <UiTextarea
              v-model="formData.description"
              :rows="2"
              :border="true"
              :auto-resize="true"
              :max-rows="4"
              size="sm"
              placeholder="데이터마트에 대한 설명을 입력하세요"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">상태</label>
            <UiSelect
              v-model="formData.useYn"
              :options="statusOptions"
              size="sm"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">정렬 순서</label>
            <UiInput
              v-model="formData.sortOrd"
              number-only
              size="sm"
            />
          </div>
        </div>
      </div>

      <!-- DB 연결 정보 -->
      <div
        class="com-setting-section"
        :class="{ 'is-collapsed': sectionCollapsed[1] }"
        style="--label-width: 100px"
      >
        <div
          class="com-setting-section-header"
          @click="sectionCollapsed[1] = !sectionCollapsed[1]"
        >
          <span class="com-setting-section-title">데이터베이스 연결 정보</span>
          <i class="icon-chevron-down size-16 com-setting-section-arrow" />
        </div>
        <div class="com-setting-section-body">
          <div class="com-setting-row db-type-version-row">
            <div class="com-setting-field-row">
              <label class="com-setting-label">
                <span class="is-required">*</span>
                DB 타입
              </label>
              <UiSelect
                ref="dbTypeRef"
                v-model="formData.dbType"
                :options="dbTypeOptions"
                placeholder="선택하세요"
                size="sm"
              />
            </div>
            <div class="com-setting-field-row">
              <label class="com-setting-label">DB 버전</label>
              <UiInput
                v-model="formData.dbVersion"
                placeholder="예: 8.0, 14, 19c"
                size="sm"
              />
            </div>
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">
              <span class="is-required">*</span>
              호스트
            </label>
            <UiInput
              ref="hostRef"
              v-model="formData.host"
              placeholder="예: db-server-01.internal 또는 192.168.1.100"
              size="sm"
            />
          </div>
          <div class="com-setting-row">
            <div class="com-setting-field-row">
              <label class="com-setting-label">
                <span class="is-required">*</span>
                포트
              </label>
              <UiInput
                ref="portRef"
                v-model="formData.port"
                number-only
                placeholder="예: 3306, 5432, 1521"
                size="sm"
              />
            </div>
            <div class="com-setting-field-row">
              <label class="com-setting-label">
                <span class="is-required">*</span>
                DB명
              </label>
              <UiInput
                ref="dbNmRef"
                v-model="formData.dbNm"
                placeholder="예: analytics_db"
                size="sm"
              />
            </div>
          </div>
          <div class="com-setting-row">
            <div class="com-setting-field-row">
              <label class="com-setting-label">
                <span class="is-required">*</span>
                사용자명
              </label>
              <UiInput
                ref="usernameRef"
                v-model="formData.username"
                placeholder="예: dbuser"
                size="sm"
              />
            </div>
            <div class="com-setting-field-row">
              <label class="com-setting-label">
                <span class="is-required">*</span>
                비밀번호
              </label>
              <UiInput
                ref="pwdRef"
                v-model="formData.pwdEnc"
                type="password"
                placeholder="••••••••"
                size="sm"
              />
            </div>
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">스키마</label>
            <UiInput
              v-model="formData.schNm"
              placeholder="예: public (PostgreSQL의 경우)"
              size="sm"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">테이블 개수</label>
            <UiInput
              v-model="formData.tblCnt"
              placeholder="0"
              size="sm"
              disabled
            />
          </div>
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">연결 옵션</label>
            <UiTextarea
              v-model="formData.connOpt"
              :rows="2"
              :border="true"
              size="sm"
              placeholder='{"charset": "utf8mb4", "timeout": 30000}'
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label" />
            <UiButton
              variant="line-secondary"
              size="sm"
              style="width: 100%"
              @click="onTestConnection"
            >
              <template #icon-left>
                <i class="icon-play size-16" />
              </template>
              연결 테스트
            </UiButton>
          </div>
        </div>
      </div>

      <!-- 액세스 제어 -->
      <div
        class="com-setting-section"
        :class="{ 'is-collapsed': sectionCollapsed[2] }"
      >
        <div
          class="com-setting-section-header"
          @click="sectionCollapsed[2] = !sectionCollapsed[2]"
        >
          <span class="com-setting-section-title">액세스 제어 및 보안</span>
          <i class="icon-chevron-down size-16 com-setting-section-arrow" />
        </div>
        <div class="com-setting-section-body">
          <UiCheckbox
            :model-value="formData.readonlyYn === 'Y'"
            label="읽기 전용 모드"
            desc="데이터 조회만 가능하고 수정/삭제는 불가능합니다."
            @update:model-value="formData.readonlyYn = $event ? 'Y' : 'N'"
          />
          <UiCheckbox
            :model-value="formData.ipWlistYn === 'Y'"
            label="IP 화이트리스트 사용"
            desc="특정 IP 주소에서만 접근을 허용합니다."
            @update:model-value="formData.ipWlistYn = $event ? 'Y' : 'N'"
          />
          <UiCheckbox
            :model-value="formData.sslYn === 'Y'"
            label="SSL/TLS 암호화 연결"
            desc="데이터베이스 연결 시 암호화된 통신을 사용합니다."
            @update:model-value="formData.sslYn = $event ? 'Y' : 'N'"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="datamart-save-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onSave"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { Datamart, DatamartForm } from '~/types/datamart'
import { useDatamartStore } from '~/composables/datamart/useDatamartStore'
import { openToast } from '~/composables/useToast'

const { handleTestConnection } = useDatamartStore()

type FieldRef = { focus?: () => void; $el?: HTMLElement } | null
const dmNmRef = ref<FieldRef>(null)
const dbTypeRef = ref<FieldRef>(null)
const hostRef = ref<FieldRef>(null)
const portRef = ref<FieldRef>(null)
const dbNmRef = ref<FieldRef>(null)
const usernameRef = ref<FieldRef>(null)
const pwdRef = ref<FieldRef>(null)

const focusField = (fieldRef: { value: any }) => {
  nextTick(() => {
    const el = fieldRef.value?.$el || fieldRef.value
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const input = el.querySelector('input, select') || el
      if ('focus' in input) (input as HTMLElement).focus()
    }
  })
}

const props = defineProps<{
  isOpen: boolean
  editData?: Datamart | null
}>()

const emit = defineEmits<{
  close: []
  save: [data: DatamartForm]
}>()

const getDefaultForm = (): DatamartForm => ({
  dmNm: '',
  description: '',
  useYn: 'Y',
  sortOrd: 0,
  dbType: 'MySQL',
  dbVersion: '',
  host: '',
  port: 3306,
  dbNm: '',
  username: '',
  pwdEnc: '',
  schNm: '',
  tblCnt: 0,
  connOpt: '',
  readonlyYn: 'N',
  ipWlistYn: 'N',
  sslYn: 'N',
})

const formData = reactive<DatamartForm>(getDefaultForm())
const sectionCollapsed = reactive([false, false, false])

const statusOptions = [
  { label: '활성', value: 'Y' },
  { label: '비활성', value: 'N' },
]

const dbTypeOptions = [
  { label: 'MySQL', value: 'MySQL' },
  { label: 'PostgreSQL', value: 'PostgreSQL' },
  { label: 'Oracle', value: 'Oracle' },
  { label: 'MS SQL Server', value: 'MSSQLServer' },
  { label: 'MariaDB', value: 'MariaDB' },
]

const isEditMode = computed(() => !!props.editData)

const mapToForm = (data: Datamart): DatamartForm => ({
  dmNm: data.dmNm,
  description: data.description,
  useYn: data.useYn,
  sortOrd: data.sortOrd,
  dbType: data.dbType,
  dbVersion: data.dbVersion,
  host: data.host,
  port: data.port,
  dbNm: data.dbNm,
  username: data.username,
  pwdEnc: data.pwdEnc,
  schNm: data.schNm,
  tblCnt: data.tblCnt,
  connOpt: data.connOpt,
  readonlyYn: data.readonlyYn,
  ipWlistYn: data.ipWlistYn,
  sslYn: data.sslYn,
})

const formToMap = (form: DatamartForm): Datamart => ({
  datamartId: props.editData?.datamartId ?? '',
  dmNm: form.dmNm,
  description: form.description,
  useYn: form.useYn,
  sortOrd: form.sortOrd,
  dbType: form.dbType,
  dbVersion: form.dbVersion,
  host: form.host,
  port: form.port,
  dbNm: form.dbNm,
  username: form.username,
  pwdEnc: form.pwdEnc,
  schNm: form.schNm,
  connOpt: form.connOpt,
  readonlyYn: form.readonlyYn,
  ipWlistYn: form.ipWlistYn,
  sslYn: form.sslYn,
  tblCnt: form.tblCnt,
  lastVerifyDt: props.editData?.lastVerifyDt ?? '',
  createDt: props.editData?.createDt ?? '',
  modifyDt: props.editData?.modifyDt ?? '',
  testType: 'form',
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      Object.assign(formData, props.editData ? mapToForm(props.editData) : getDefaultForm())
      Object.assign(sectionCollapsed, [false, false, false])
    }
  },
)

const onTestConnection = async () => {
  const datamart = formToMap(formData)
  const response = await handleTestConnection(datamart, 'form')
  if (response?.result === 'SUCCESS') {
    formData.tblCnt = response?.tblCnt ?? 0
  }
}

const onSave = () => {
  if (!formData.dmNm.trim()) {
    openToast({ message: '데이터마트명을 입력해주세요.', type: 'warning' })
    focusField(dmNmRef)
    return
  }
  if (!formData.dbType) {
    openToast({ message: 'DB 타입을 선택해주세요.', type: 'warning' })
    focusField(dbTypeRef)
    sectionCollapsed[1] = false
    return
  }
  if (!formData.host.trim()) {
    openToast({ message: '호스트를 입력해주세요.', type: 'warning' })
    focusField(hostRef)
    sectionCollapsed[1] = false
    return
  }
  if (!formData.port) {
    openToast({ message: '포트를 입력해주세요.', type: 'warning' })
    focusField(portRef)
    sectionCollapsed[1] = false
    return
  }
  if (!formData.dbNm.trim()) {
    openToast({ message: 'DB명을 입력해주세요.', type: 'warning' })
    focusField(dbNmRef)
    sectionCollapsed[1] = false
    return
  }
  if (!formData.username.trim()) {
    openToast({ message: '사용자명을 입력해주세요.', type: 'warning' })
    focusField(usernameRef)
    sectionCollapsed[1] = false
    return
  }
  if (!formData.pwdEnc.trim()) {
    openToast({ message: '비밀번호를 입력해주세요.', type: 'warning' })
    focusField(pwdRef)
    sectionCollapsed[1] = false
    return
  }
  emit('save', { ...formData })
}
</script>

<style lang="scss" scoped>
.db-type-version-row {
  > .com-setting-field-row {
    flex: 1;
    min-width: 0;
  }
}
</style>
