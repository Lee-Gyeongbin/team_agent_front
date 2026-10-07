<template>
  <UiModal
    :is-open="isOpen && !isPickingMembers"
    position="center"
    max-width="480px"
    :title="isEditMode ? '마케팅 프로젝트 수정' : '새 마케팅 프로젝트'"
    custom-class="marketing-new-modal"
    @close="onClose"
  >
    <div
      ref="nameFieldRef"
      class="marketing-form-field"
    >
      <label class="marketing-form-label">프로젝트명 <span class="marketing-req">*</span></label>
      <UiInput
        ref="nameInputRef"
        v-model="form.projectNm"
        placeholder="예) AI 제품 출시 프로젝트"
        size="sm"
      />
    </div>
    <div
      ref="purposeFieldRef"
      class="marketing-form-field"
    >
      <label class="marketing-form-label">목적 <span class="marketing-req">*</span></label>
      <UiInput
        ref="purposeInputRef"
        v-model="form.summary"
        placeholder="예) 신제품 출시 인지도 확보"
        size="sm"
      />
    </div>
    <div
      ref="dueDtFieldRef"
      class="marketing-form-field"
    >
      <label class="marketing-form-label">종료일 <span class="marketing-req">*</span></label>
      <UiDatePicker
        v-model="dueDtValue"
        size="sm"
      />
    </div>
    <div class="marketing-form-field">
      <label class="marketing-form-label">고객사</label>
      <UiInput
        v-model="form.orgNm"
        placeholder="예) 브랜드팀"
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
    <div class="marketing-form-field">
      <label class="marketing-form-label">승인자 <span class="marketing-req">*</span></label>
      <UiSelect
        v-if="canEditApprover"
        v-model="form.approverUserId"
        :options="approverOptions"
        placeholder="승인자를 선택하세요"
        size="sm"
      />
      <p v-else>{{ props.project?.approverUserNm || '미지정' }}</p>
      <p class="marketing-form-hint">
        프로젝트 작성자만 지정·변경할 수 있습니다. 변경 시 진행 중인 승인을 다시 받아야 합니다.
      </p>
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
          {{ isEditMode ? '저장' : '프로젝트 생성' }}
        </UiButton>
      </div>
    </template>
  </UiModal>

  <UserSelectModal
    :is-open="isUserSelectModalOpen"
    title="공개 범위 - 멤버 추가"
    confirm-text="추가"
    @close="onCloseMemberSelect"
    @confirm="onMemberSelectConfirm"
  />
</template>

<script setup lang="ts">
import { CalendarDate, toCalendarDateTime, type DateValue } from '@internationalized/date'
import { UiButton, UiDatePicker, UiIcon, UiInput, UiModal, UiSelect } from '@leechanyong/ispark-ui'
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
const isPickingMembers = ref(false)

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
  isPickingMembers.value = true
  void openUserSelectModal()
}

const onCloseMemberSelect = () => {
  closeUserSelectModal()
  isPickingMembers.value = false
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
  if (form.value.approverUserId === userId) {
    openToast({ message: '승인자를 먼저 변경한 후 멤버를 제거해 주세요.', type: 'warning' })
    return
  }
  selectedMembers.value = selectedMembers.value.filter((m) => m.userId !== userId)
}

const defaultForm = () => ({
  projectNm: '',
  orgNm: '',
  summary: '',
  dueDt: '',
  statusCd: '001',
  approverUserId: '',
})

const form = ref(defaultForm())

const isEditMode = computed(() => !!props.project?.marketingProjectId)
const canEditApprover = computed(() => !isEditMode.value || props.project?.createUserId === user.value?.userId)
const approverOptions = computed(() => {
  const owner = ownerMember.value
  const members = selectedMembers.value.filter((member) => member.userId !== owner?.userId)
  const options = members.map((member) => ({ value: member.userId, label: member.userNm }))
  if (!owner?.userId) return options
  return [{ value: owner.userId, label: `${owner.userNm} (작성자)` }, ...options]
})

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

const nameFieldRef = ref<HTMLElement | null>(null)
const purposeFieldRef = ref<HTMLElement | null>(null)
const dueDtFieldRef = ref<HTMLElement | null>(null)
const nameInputRef = ref<{ focus: () => void } | null>(null)
const purposeInputRef = ref<{ focus: () => void } | null>(null)

const focusField = (fieldEl: HTMLElement | null, input?: { focus: () => void } | null) => {
  fieldEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  input?.focus()
}

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
    approverUserId: props.project.approverUserId ?? '',
  }
  const ownerId = props.project.createUserId
  selectedMembers.value = props.members.filter((m) => m.userId !== ownerId).map(toOrgUserItem)
}

// 부모에서 열릴 때 마운트하므로 입력값은 여기서 한 번만 초기화한다.
syncFormFromProject()

const onClose = () => {
  if (isPickingMembers.value) return
  emit('close')
}

const onSubmit = () => {
  if (!form.value.projectNm.trim()) {
    openToast({ message: '프로젝트명을 입력해 주세요.', type: 'warning' })
    focusField(nameFieldRef.value, nameInputRef.value)
    return
  }
  if (!form.value.summary.trim()) {
    openToast({ message: '목적을 입력해 주세요.', type: 'warning' })
    focusField(purposeFieldRef.value, purposeInputRef.value)
    return
  }
  if (!form.value.dueDt.trim()) {
    openToast({ message: '종료일을 선택해 주세요.', type: 'warning' })
    focusField(dueDtFieldRef.value)
    return
  }
  if (canEditApprover.value && !form.value.approverUserId) {
    openToast({ message: '프로젝트 승인자를 선택해 주세요.', type: 'warning' })
    return
  }
  emit('submit', {
    ...form.value,
    ...(props.project?.marketingProjectId ? { marketingProjectId: props.project.marketingProjectId } : {}),
    memberUserIds: selectedMembers.value.map((m) => m.userId),
  })
}
</script>
