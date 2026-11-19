<template>
  <div class="notice-index inq-index wide-center">
    <div class="notice-header flex justify-between items-center">
      <p class="notice-description">궁금한 점을 문의하고 답변을 확인할 수 있습니다.</p>
      <div class="right-grp flex items-center">
        <p class="total">
          총 <strong>{{ totalCount }}건</strong>
        </p>
        <div class="notice-input-grp shrink-0 grow-1 max-w-280">
          <UiInput
            v-model="searchKeyword"
            type="search"
            size="sm"
            placeholder="제목, 내용 또는 작성자 검색"
            @search="onSearch"
            @enter="onSearch"
          />
        </div>
        <div class="notice-select-grp inq-filter-grp shrink-0">
          <span class="inq-filter-label">구분</span>
          <div class="inq-filter-select">
            <UiSelect
              v-model="searchCatCd"
              :options="listCatOptions"
              placeholder="구분 선택"
              size="sm"
            />
          </div>
        </div>
        <div class="notice-select-grp inq-filter-grp shrink-0">
          <span class="inq-filter-label">처리상태</span>
          <div class="inq-filter-select">
            <UiSelect
              v-model="searchStatusCd"
              :options="listStatusOptions"
              placeholder="처리상태 선택"
              size="sm"
            />
          </div>
        </div>
        <div class="notice-btn-grp flex items-center shrink-0 gap-2">
          <UiButton
            v-if="hasFunc"
            variant="primary"
            size="sm"
            @click="onRegisterInq"
          >
            <template #icon-left>
              <UiIcon
                name="plus"
                size="16"
              />
            </template>
            등록
          </UiButton>
          <UiButton
            variant="outline"
            size="sm"
            @click="handleSelectInqList"
          >
            <template #icon-left>
              <UiIcon
                name="refresh-cw"
                size="16"
              />
            </template>
            새로고침
          </UiButton>
        </div>
      </div>
    </div>

    <div class="notice-list-panel">
      <div class="notice-content">
        <UiLoading
          v-if="isLoading"
          overlay
          text="문의사항을 불러오는 중..."
        />

        <div
          v-else-if="errorMessage"
          class="notice-error"
        >
          <p class="notice-error__message">{{ errorMessage }}</p>
          <UiButton
            variant="outline"
            size="md"
            @click="handleSelectInqList"
          >
            다시 시도
          </UiButton>
        </div>

        <UiEmpty
          v-else-if="totalCount === 0"
          icon="icon-search"
          :title="emptyTitle"
        />

        <div
          v-else
          class="notice-table-stack"
        >
          <div class="notice-table-wrap">
            <UiTable
              :columns="inqColumns"
              :data="inqList"
              sticky-header
            >
              <template #cell-inqId="{ row }">
                {{ getInqOrderLabel(row as InqRow) }}
              </template>
              <template #cell-title="{ row }">
                <button
                  type="button"
                  class="notice-title-btn"
                  @click.stop="onOpenInqDetail(row as InqRow)"
                >
                  <span class="notice-title-text">{{ getInqTitleLabel(row as InqRow) }}</span>
                </button>
              </template>
              <template #cell-createDt="{ row }">
                {{ toInqDateOnly((row as InqRow).createDt) }}
              </template>
              <template #cell-statusNm="{ row }">
                <UiBadge
                  :variant="getInqStatusVariant(getStatusFlag((row as InqRow).statusCd))"
                  size="sm"
                >
                  {{ (row as InqRow).statusNm }}
                </UiBadge>
              </template>
            </UiTable>
          </div>

          <div class="notice-pagination-stack">
            <UiPagination
              v-if="totalPages > 1"
              v-model="page"
              :total-count="totalCount"
              :page-size="pageSize"
              total-label="개 문의사항"
              align="center"
              class="notice-pagination"
            />
          </div>
        </div>
      </div>
    </div>

    <InqFormPanel
      :is-open="isFormOpen"
      :form-data="inqForm"
      :cat-options="catOptions"
      :agent-options="agentOptions"
      :is-agent-cat="isAgentCat"
      :panel-action-label="panelActionLabel"
      :files="formFiles"
      :attached-file-items="attachedFileItems"
      @update:form-data="(payload) => (inqForm = payload)"
      @update:files="(files) => (formFiles = files)"
      @remove-attached-file="onRemoveAttachedFile"
      @save="onSaveInqForm"
      @close="onCloseInqForm"
    />
    <InqDetailPanel
      :is-open="isDetailOpen"
      :inq="selectedInq"
      :files="inqFiles"
      :answers="orderedAnswers"
      :composer="composer"
      :is-masked="isMasked"
      :status-flag="getStatusFlag(selectedInq?.statusCd)"
      :max-depth="ansrMaxDepth"
      :can-edit="canEditInq"
      :can-reply="canReply"
      :can-edit-ansr="canEditAnsr"
      @close="onCloseInqDetail"
      @edit="onEditInq"
      @delete="onDeleteInq"
      @download-file="onDownloadInqFile"
      @start-reply="onStartReply"
      @start-edit="onStartEditAnsr"
      @delete-ansr="onDeleteAnsr"
      @update:composer-text="onChangeComposerText"
      @save-composer="onSaveComposer"
      @cancel-composer="onCancelComposer"
    />
  </div>
</template>

<script setup lang="ts">
import {
  UiInput,
  UiSelect,
  UiButton,
  UiIcon,
  UiLoading,
  UiTable,
  UiPagination,
  UiBadge,
  UiEmpty,
} from '@leechanyong/ispark-ui'
import type { InqRow } from '~/types/inq'
import { inqColumns } from '~/types/inq'
import { getInqStatusVariant, getInqTitleLabel, toInqDateOnly } from '~/utils/inq/inqUtil'

const {
  inqList,
  totalCount,
  totalPages,
  currentPage,
  searchKeyword,
  searchCatCd,
  searchStatusCd,
  isLoading,
  errorMessage,
  emptyTitle,
  catOptions,
  listCatOptions,
  listStatusOptions,
  agentOptions,
  hasFunc,
  isDetailOpen,
  selectedInq,
  inqFiles,
  orderedAnswers,
  composer,
  isMasked,
  canEditInq,
  canReply,
  canEditAnsr,
  isFormOpen,
  inqForm,
  formFiles,
  attachedFileItems,
  isAgentCat,
  panelActionLabel,
  handleSelectInqOptions,
  handleSelectInqList,
  getInqOrderLabel,
  getStatusFlag,
  pageSize,
  ansrMaxDepth,
  onOpenInqDetail,
  onCloseInqDetail,
  onDeleteInq,
  onStartReply,
  onStartEditAnsr,
  onChangeComposerText,
  onCancelComposer,
  onSaveComposer,
  onDeleteAnsr,
  onDownloadInqFile,
  onRegisterInq,
  onEditInq,
  onCloseInqForm,
  onSaveInqForm,
  onRemoveAttachedFile,
} = useInqStore()

const page = computed({
  get: () => currentPage.value,
  set: (value: number) => {
    currentPage.value = value
    handleSelectInqList()
  },
})

const onSearch = () => {
  currentPage.value = 1
  handleSelectInqList()
}

// 구분·처리상태 필터 변경 시 1페이지부터 재조회
watch([searchCatCd, searchStatusCd], () => {
  currentPage.value = 1
  handleSelectInqList()
})

// 알림에서 넘어온 refId(문의 ID)가 있으면 해당 문의 상세를 바로 연다
const route = useRoute()
const router = useRouter()
const openInqByRefId = async () => {
  const refId = String(route.query.refId ?? '')
  if (!refId) return
  await router.replace({ query: {} })
  await onOpenInqDetail({ inqId: refId })
}

// 이미 이 화면에 있을 때 알림을 눌러도 상세가 열리도록 쿼리 변경을 감시
watch(() => route.query.refId, openInqByRefId)

onMounted(async () => {
  await handleSelectInqOptions()
  await handleSelectInqList()
  await openInqByRefId()
})

definePageMeta({ layout: 'default', permission: 'read' })
</script>
