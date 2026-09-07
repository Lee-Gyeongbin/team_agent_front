<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    max-width="480px"
    :title="isEditMode ? '마케팅 프로젝트 수정' : '새 마케팅 프로젝트'"
    custom-class="marketing-new-modal"
    @close="onClose"
  >
    <div class="marketing-form-field">
      <label class="marketing-form-label">프로젝트명 <span class="marketing-req">*</span></label>
      <UiInput
        v-model="form.projectNm"
        placeholder="예) 여름 시즌 신제품 SNS 캠페인"
        size="sm"
      />
    </div>
    <div class="marketing-form-field">
      <label class="marketing-form-label">고객사</label>
      <UiInput
        v-model="form.orgNm"
        placeholder="예) 올리브영"
        size="sm"
      />
    </div>
    <div class="marketing-form-field">
      <label class="marketing-form-label">캠페인 개요</label>
      <UiTextarea
        v-model="form.summary"
        placeholder="캠페인 목적, 타깃, 핵심 메시지를 간단히 입력하세요 (선택)"
        :rows="3"
        border
        size="sm"
        :auto-resize="false"
      />
    </div>
    <div class="marketing-form-field">
      <label class="marketing-form-label">종료일</label>
      <UiDatePicker
        v-model="dueDtValue"
        size="sm"
      />
    </div>
    <div class="marketing-form-field">
      <div class="marketing-form-label-group">
        <label class="marketing-form-label">공개 범위</label>
        <p class="marketing-form-hint">선택한 인원만 이 프로젝트에 접근할 수 있습니다. 작성자는 항상 포함됩니다.</p>
      </div>
      <div class="marketing-member-chips">
        <span
          v-if="ownerMember"
          class="marketing-member-chip is-owner"
        >
          {{ ownerMember.userNm }}
          <em>작성자</em>
        </span>
        <span
          v-for="member in selectedMembers"
          :key="member.userId"
          class="marketing-member-chip"
        >
          {{ member.userNm }}
          <button
            type="button"
            class="btn-marketing-member-remove"
            @click="removeMember(member.userId)"
          >
            <UiIcon
              name="x"
              size="12"
            />
          </button>
        </span>
        <button
          type="button"
          class="marketing-member-chip is-add"
          @click="openMemberSelect"
        >
          + 멤버 추가
        </button>
      </div>
    </div>
    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          class="btn-modal-dialog"
          variant="outline"
          size="xlg"
          :disabled="isSaving"
          @click="onClose"
        >
          취소
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="xlg"
          :loading="isSaving"
          @click="onSubmit"
        >
          {{ isEditMode ? '저장' : '시작' }}
        </UiButton>
      </div>
    </template>
  </UiModal>

  <UserSelectModal
    :is-open="isUserSelectModalOpen"
    title="공개 범위 - 멤버 추가"
    confirm-text="추가"
    @close="closeUserSelectModal"
    @confirm="onMemberSelectConfirm"
  />
</template>

<script setup lang="ts">
import { CalendarDate, toCalendarDateTime, type DateValue } from '@internationalized/date'
import { UiButton, UiDatePicker, UiIcon, UiInput, UiModal, UiTextarea } from '@leechanyong/ispark-ui'
import type { MarketingProject, MarketingProjectMember, MarketingProjectSaveForm } from '~/types/marketing'
import type { OrgUserItem } from '~/types/org-manage'
import { useUserSelectStore } from '~/composables/com/useUserSelectStore'

interface Props {
  isOpen: boolean
  isSaving?: boolean
  /** 수정 시 기존 프로젝트. 없으면 신규 */
  project?: MarketingProject | null
  /** 수정 시 기존 공개범위(멤버) 목록 — selectMarketingProject.do 응답의 members */
  members?: MarketingProjectMember[]
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false,
  project: null,
  members: () => [],
})

const emit = defineEmits<{
  close: []
  submit: [form: MarketingProjectSaveForm]
}>()

const { user } = useAuth()
const { isUserSelectModalOpen, openUserSelectModal, closeUserSelectModal } = useUserSelectStore()

/** 공개범위 — 작성자 외 추가 멤버 (칩 표시/제출용) */
const selectedMembers = ref<OrgUserItem[]>([])

const toOrgUserItem = (member: { userId: string; userNm: string; email: string }): OrgUserItem => ({
  userId: member.userId,
  userNm: member.userNm,
  email: member.email,
  phone: '',
  acctStatusDesc: '',
  profileImgUrl: null,
})

/** 작성자(고정, 제거 불가) — 신규는 나, 수정은 기존 작성자 */
const ownerMember = computed<OrgUserItem | null>(() => {
  if (isEditMode.value) {
    const ownerId = props.project?.createUserId
    const found = props.members.find((m) => m.userId === ownerId)
    return found ? toOrgUserItem(found) : null
  }
  const me = user.value
  return me ? toOrgUserItem(me) : null
})

const openMemberSelect = () => {
  void openUserSelectModal()
}

/** 이미 추가된 멤버·작성자와 중복 없이 병합 */
const onMemberSelectConfirm = (users: OrgUserItem[]) => {
  const ownerId = ownerMember.value?.userId
  const merged = [...selectedMembers.value]
  users.forEach((selectedUser) => {
    if (selectedUser.userId === ownerId) return
    if (!merged.some((m) => m.userId === selectedUser.userId)) {
      merged.push(selectedUser)
    }
  })
  selectedMembers.value = merged
}

const removeMember = (userId: string) => {
  selectedMembers.value = selectedMembers.value.filter((m) => m.userId !== userId)
}

const defaultForm = () => ({
  projectNm: '',
  orgNm: '',
  summary: '',
  dueDt: '',
  statusCd: '001',
})

const form = ref(defaultForm())

const isEditMode = computed(() => !!props.project?.marketingProjectId)

/** 마감일 YYYY-MM-DD ↔ DateValue */
const parseYyyyMmDdToDateValue = (value: string): DateValue | undefined => {
  if (!value) return undefined
  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!year || !month || !day) return undefined
  return new CalendarDate(year, month, day)
}

const formatDateValueToYyyyMmDd = (value: DateValue | undefined): string => {
  if (!value) return ''
  const { year, month, day } = toCalendarDateTime(value)
  const monthText = String(month).padStart(2, '0')
  const dayText = String(day).padStart(2, '0')
  return `${year}-${monthText}-${dayText}`
}

const dueDtValue = computed<DateValue | undefined>({
  get: () => parseYyyyMmDdToDateValue(form.value.dueDt),
  set: (value) => {
    form.value.dueDt = formatDateValueToYyyyMmDd(value)
  },
})

const syncFormFromProject = () => {
  if (!props.project) {
    form.value = defaultForm()
    selectedMembers.value = []
    return
  }
  form.value = {
    projectNm: props.project.projectNm ?? '',
    orgNm: props.project.orgNm ?? '',
    summary: props.project.projectOverview ?? '',
    dueDt: props.project.dueDt ?? '',
    statusCd: props.project.statusCd ?? '001',
  }
  const ownerId = props.project.createUserId
  selectedMembers.value = props.members.filter((m) => m.userId !== ownerId).map(toOrgUserItem)
}

watch(
  () => [props.isOpen, props.project] as const,
  ([isOpen]) => {
    if (isOpen) syncFormFromProject()
  },
)

const onClose = () => {
  form.value = defaultForm()
  selectedMembers.value = []
  emit('close')
}

const onSubmit = () => {
  if (!form.value.projectNm.trim()) {
    openToast({ message: '프로젝트명을 입력해 주세요.', type: 'warning' })
    return
  }
  emit('submit', {
    ...form.value,
    ...(props.project?.marketingProjectId ? { marketingProjectId: props.project.marketingProjectId } : {}),
    memberUserIds: selectedMembers.value.map((m) => m.userId),
  })
}
</script>
