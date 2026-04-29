<template>
  <div class="org-manage-member-panel">
    <div class="org-manage-panel-header flex items-center justify-between flex-wrap gap-8">
      <div>
        <template v-if="selectedOrgId">
          <dl class="org-manage-member-selected-org">
            <div class="org-manage-member-selected-row org-manage-member-selected-row--name">
              <dd>{{ selectedOrgName || '-' }}</dd>
            </div>
            <div class="org-manage-member-selected-row">
              <dt>팀 코드</dt>
              <dd>{{ selectedOrgId }}</dd>
            </div>
          </dl>
        </template>
        <p
          v-else
          class="org-manage-panel-title"
        >
          팀원
        </p>
      </div>
      <div class="org-manage-header-actions flex items-center gap-8">
        <UiButton
          variant="outline"
          size="sm"
          :disabled="!selectedOrgId"
          @click="openEditOrgModal"
        >
          <template #icon-left>
            <i class="icon icon-edit size-14" />
          </template>
          조직 수정
        </UiButton>
        <UiButton
          class="org-manage-delete-btn"
          variant="outline"
          size="sm"
          :disabled="!selectedOrgId"
          @click="handleDeleteOrg"
        >
          <template #icon-left>
            <i class="icon icon-trashcan size-14" />
          </template>
          삭제
        </UiButton>
      </div>
    </div>

    <div class="org-manage-member-body">
      <UiLoading
        v-if="isLoading"
        overlay
        text="팀원 정보를 불러오는 중..."
      />
      <div
        v-else-if="errorMessage"
        class="org-manage-panel-error"
      >
        <p class="org-manage-panel-error__message">{{ errorMessage }}</p>
        <UiButton
          variant="outline"
          size="md"
          @click="emit('retry')"
        >
          다시 시도
        </UiButton>
      </div>
      <div
        v-else-if="!selectedOrgId"
        class="org-manage-panel-empty"
      >
        <UiEmpty
          icon="icon-user"
          title="조직을 선택해 주세요."
          description="왼쪽 조직도에서 부서를 선택하면 소속 팀원이 표시됩니다."
        />
      </div>
      <div
        v-else
        class="org-manage-member-list-wrap"
      >
        <UiEmpty
          v-if="!orgUserList.length"
          icon="icon-user"
          title="해당 조직에 등록된 팀원이 없습니다."
        />
        <ul
          v-else
          class="org-manage-member-list"
        >
          <li
            v-for="member in orgUserList"
            :key="member.userId"
            class="org-manage-member-card"
          >
            <div class="org-manage-member-card-top">
              <div class="org-manage-member-avatar">
                <img
                  v-if="member.profileImgUrl"
                  :src="member.profileImgUrl"
                  alt=""
                  class="org-manage-member-avatar-image"
                />
                <i
                  v-else
                  class="icon icon-user size-28"
                />
              </div>
              <div class="org-manage-member-head">
                <p class="org-manage-member-name">{{ member.userNm || '-' }}</p>
                <p class="org-manage-member-id">{{ member.userId || '-' }}</p>
              </div>
            </div>
            <div class="org-manage-member-divider" />
            <dl class="org-manage-member-meta">
              <div class="org-manage-member-meta-item">
                <dt>이메일</dt>
                <dd>{{ member.email || '-' }}</dd>
              </div>
              <div class="org-manage-member-meta-item">
                <dt>전화번호</dt>
                <dd>{{ formatPhone(member.phone) || '-' }}</dd>
              </div>
              <div class="org-manage-member-meta-item">
                <dt>활성상태</dt>
                <dd>
                  <span
                    class="org-manage-member-status"
                    :class="getMemberStatusClass(member.acctStatusDesc)"
                  >
                    {{ member.acctStatusDesc || '-' }}
                  </span>
                </dd>
              </div>
            </dl>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrgUserItem } from '~/types/org-manage'
import { formatPhone } from '~/utils/global/numberUtil'

defineProps<{
  selectedOrgId: string | null
  selectedOrgName: string
  orgUserList: OrgUserItem[]
  isLoading: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  retry: []
}>()

const { openEditOrgModal, handleDeleteOrg } = useOrgManageStore()

const getMemberStatusClass = (status: string): string => {
  if (status === '잠금') return 'is-lock'
  if (status === '비활성') return 'is-inactive'
  return 'is-active'
}
</script>
