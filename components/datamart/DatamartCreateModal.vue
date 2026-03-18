<template>
  <UiModal
    :is-open="isOpen"
    title="데이터마트 추가"
    max-width="720px"
    custom-class="datamart-create-modal"
    show-fullscreen
    @close="$emit('close')"
  >
    <div class="datamart-create-form com-setting-form">
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
              v-model="formData.name"
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
              v-model="formData.status"
              :options="statusOptions"
              size="sm"
            />
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">정렬 순서</label>
            <UiInput
              v-model="formData.sortOrder"
              type="number"
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
          <div class="com-setting-row">
            <div class="com-setting-field-row">
              <label class="com-setting-label">
                <span class="is-required">*</span>
                DB 타입
              </label>
              <UiSelect
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
                v-model="formData.port"
                type="number"
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
                v-model="formData.dbName"
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
                v-model="formData.password"
                type="password"
                placeholder="••••••••"
                size="sm"
              />
            </div>
          </div>
          <div class="com-setting-field-row">
            <label class="com-setting-label">스키마</label>
            <UiInput
              v-model="formData.schema"
              placeholder="예: public (PostgreSQL의 경우)"
              size="sm"
            />
          </div>
          <div class="com-setting-field-row is-top">
            <label class="com-setting-label">연결 옵션</label>
            <UiTextarea
              v-model="formData.connectionOptions"
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
            v-model="formData.readOnly"
            label="읽기 전용 모드"
            desc="데이터 조회만 가능하고 수정/삭제는 불가능합니다."
          />
          <UiCheckbox
            v-model="formData.ipWhitelist"
            label="IP 화이트리스트 사용"
            desc="특정 IP 주소에서만 접근을 허용합니다."
          />
          <UiCheckbox
            v-model="formData.useSsl"
            label="SSL/TLS 암호화 연결"
            desc="데이터베이스 연결 시 암호화된 통신을 사용합니다."
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="datamart-create-footer">
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
import type { DatamartForm } from '~/types/datamart'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: DatamartForm]
}>()

const getDefaultForm = (): DatamartForm => ({
  name: '',
  description: '',
  status: 'active',
  sortOrder: 0,
  dbType: '',
  dbVersion: '',
  host: '',
  port: '',
  dbName: '',
  username: '',
  password: '',
  schema: '',
  connectionOptions: '',
  readOnly: false,
  ipWhitelist: false,
  useSsl: false,
})

const formData = reactive<DatamartForm>(getDefaultForm())
const sectionCollapsed = reactive([false, false, true])

const statusOptions = [
  { label: '활성', value: 'active' },
  { label: '비활성', value: 'inactive' },
]

const dbTypeOptions = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'Oracle', value: 'oracle' },
  { label: 'MS SQL Server', value: 'mssql' },
  { label: 'MariaDB', value: 'mariadb' },
]

// 모달 열릴 때 폼 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      Object.assign(formData, getDefaultForm())
      Object.assign(sectionCollapsed, [false, false, true])
    }
  },
)

const onTestConnection = () => {
  console.warn('[TODO] 연결 테스트:', {
    dbType: formData.dbType,
    host: formData.host,
    port: formData.port,
    dbName: formData.dbName,
    username: formData.username,
  })
}

const onSave = () => {
  emit('save', { ...formData })
}
</script>
