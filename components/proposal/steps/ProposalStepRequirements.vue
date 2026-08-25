<template>
  <div :class="['pt-panel', 'pt-panel--lg', 'pt-step-b', { 'is-fullscreen': isFullscreen }]">
    <div class="pt-step-b-head">
      <h3 class="pt-panel-title">목차·요구사항</h3>
      <p class="pt-panel-desc">RFP에서 추출한 목차·요구사항·평가기준·현황이슈를 확인하고 보완하세요.</p>
      <UiButton
        variant="outline"
        size="sm"
        @click="isPromptModalOpen = true"
      >
        <template #icon-left>
          <UiIcon
            name="pencil"
            size="14"
          />
        </template>
        프롬프트
      </UiButton>

      <!-- RFP 파일 업로드 -->
      <div class="pt-step-b-rfp">
        <div
          class="pt-dropzone pt-step-b-dropzone"
          :class="{ 'is-filled': Boolean(rfpFile || savedRfpFileNm) }"
          @click="onClickRfpDropzone"
          @dragover.prevent
          @drop.prevent="onDropRfp"
        >
          <UiIcon
            name="paperclip"
            size="18"
          />
          <span
            v-if="rfpFile"
            class="pt-dropzone-file"
          >
            <UiIcon
              name="file-text"
              size="14"
            />
            {{ rfpFile.name }}
            <button
              class="pt-dropzone-remove"
              @click.stop="rfpFile = null"
            >
              <UiIcon
                name="x"
                size="12"
              />
            </button>
          </span>
          <span
            v-else-if="savedRfpFileNm"
            class="pt-dropzone-file"
          >
            <UiIcon
              name="file-text"
              size="14"
            />
            {{ savedRfpFileNm }}
            <span class="pt-dropzone-tag">저장됨</span>
          </span>
          <span v-else>RFP 파일을 첨부하세요 (PDF · 최대 50MB · 1개)</span>
          <input
            ref="rfpInputRef"
            type="file"
            accept=".pdf"
            style="display: none"
            @change="onRfpFileChange"
          />
        </div>
        <div class="pt-rfp-btn-row">
          <UiButton
            v-if="!savedRfpFileNm"
            variant="primary"
            size="sm"
            :loading="isUploading"
            :disabled="!rfpFile"
            @click="onUploadRfp"
          >
            RFP 업로드
          </UiButton>
          <UiDropdownMenu
            :items="rfpMenuItems"
            @select="onRfpMenuSelect"
          >
            <template #trigger>
              <UiButton
                variant="outline"
                size="sm"
                icon-only
                title="RFP 작업 더보기"
                aria-label="RFP 작업 더보기"
              >
                <template #icon-left>
                  <UiIcon
                    name="ellipsis-vertical"
                    size="18"
                  />
                </template>
              </UiButton>
            </template>
          </UiDropdownMenu>
          <UiButton
            variant="ghost"
            size="sm"
            icon-only
            :title="isFullscreen ? '전체화면 해제 (Esc)' : '전체화면으로 보기'"
            :aria-label="isFullscreen ? '전체화면 해제' : '전체화면으로 보기'"
            @click="toggleFullscreen"
          >
            <template #icon-left>
              <UiIcon
                :name="isFullscreen ? 'minimize-2' : 'maximize-2'"
                size="16"
              />
            </template>
          </UiButton>
        </div>
      </div>
    </div>

    <ProposalPromptModal
      :is-open="isPromptModalOpen"
      :stage-cds="['S1_EXTRACT']"
      @close="isPromptModalOpen = false"
    />

    <div class="pt-step-b-body">
      <UiTab
        v-model="activeTab"
        class="pt-step-b-tabs"
        :tabs="subTabs"
        align="left"
        aria-label="요구사항 하위 탭"
      />

      <!-- 목차 탭 -->
      <div
        v-show="activeTab === 'toc'"
        class="pt-step-b-tab"
      >
        <div class="pt-toc-toolbar">
          <div class="pt-toc-toolbar-actions">
            <UiButton
              variant="primary-line"
              size="sm"
              @click="onAddItem(null)"
            >
              <template #icon-left>
                <UiIcon
                  name="plus"
                  size="14"
                />
              </template>
              대목차 추가
            </UiButton>
          </div>
        </div>
        <div class="pt-step-b-scroll-list">
          <template v-if="isLoading">
            <div
              v-for="i in 4"
              :key="i"
              class="pt-toc-skeleton"
            />
          </template>
          <draggable
            v-else-if="tocList.length > 0"
            v-model="tocList"
            item-key="tocId"
            handle=".pt-toc-drag"
            animation="200"
            class="pt-toc-list"
            @end="onDragEnd"
          >
            <template #item="{ element }">
              <div
                v-show="!hiddenTocIds.has(element.tocId)"
                :id="'toc-row-' + element.tocId"
                :class="['pt-toc-item', { 'is-sub': !!element.parentId, 'is-editing': editingTocId === element.tocId }]"
              >
                <span class="pt-toc-drag">
                  <UiIcon
                    name="grip-vertical"
                    size="14"
                  />
                </span>
                <!-- 접기 토글 — 자식이 없으면 자리만 차지시켜 제목 시작선을 맞춘다 -->
                <button
                  type="button"
                  :class="[
                    'pt-toc-collapse',
                    {
                      'is-expanded': !collapsedTocIds.has(element.tocId),
                      'is-empty': !hasChildToc(element.tocId),
                    },
                  ]"
                  :aria-expanded="!collapsedTocIds.has(element.tocId)"
                  :aria-label="collapsedTocIds.has(element.tocId) ? '소목차 펼치기' : '소목차 접기'"
                  @click="toggleTocCollapse(element.tocId)"
                >
                  <UiIcon
                    name="chevron-right"
                    size="16"
                  />
                </button>
                <!-- 편집 중에만 input — 평소엔 글자 폭만 차지하는 button으로 액션을 제목 옆에 붙임 -->
                <template v-if="editingTocId === element.tocId">
                  <input
                    :ref="setEditInput"
                    v-model="editingTitle"
                    class="pt-toc-input"
                    @blur="onCommitTitle"
                    @keydown.enter.prevent="onCommitTitle"
                    @keydown.esc="onCancelEditTitle"
                  />
                  <!-- mousedown.prevent — 클릭 전에 blur가 먼저 터져 취소가 저장으로 바뀌는 것 방지 -->
                  <div class="pt-toc-edit-actions">
                    <UiButton
                      variant="ghost"
                      size="xs"
                      icon-only
                      class="pt-toc-edit-ok"
                      aria-label="제목 저장"
                      title="저장 (Enter)"
                      @mousedown.prevent
                      @click="onCommitTitle"
                    >
                      <template #icon-left>
                        <UiIcon
                          name="check"
                          size="14"
                        />
                      </template>
                    </UiButton>
                    <UiButton
                      variant="ghost"
                      size="xs"
                      icon-only
                      aria-label="편집 취소"
                      title="취소 (Esc)"
                      @mousedown.prevent
                      @click="onCancelEditTitle"
                    >
                      <template #icon-left>
                        <UiIcon
                          name="x"
                          size="14"
                        />
                      </template>
                    </UiButton>
                  </div>
                </template>
                <button
                  v-else
                  type="button"
                  class="pt-toc-title"
                  @click="onStartEditTitle(element)"
                >
                  {{ element.title }}
                </button>
                <!-- 맥락 액션 — 제목 바로 옆 -->
                <UiButton
                  v-if="element.parentId === null"
                  variant="outline"
                  size="xs"
                  class="pt-toc-add-child"
                  @click="onAddItem(element.tocId)"
                >
                  <template #icon-left>
                    <UiIcon
                      name="plus"
                      size="14"
                    />
                  </template>
                  소목차 추가
                </UiButton>
                <!-- 삭제 — hover 시에만 노출 -->
                <UiButton
                  variant="ghost"
                  size="xs"
                  icon-only
                  class="pt-toc-del"
                  aria-label="목차 삭제"
                  title="삭제"
                  @click="onDeleteItem(element)"
                >
                  <template #icon-left>
                    <UiIcon
                      name="trash-2"
                      size="14"
                    />
                  </template>
                </UiButton>
                <UiBadge
                  class="pt-toc-badge"
                  :variant="element.source === 'rfp' ? 'info' : 'warning'"
                  size="sm"
                >
                  {{ element.source === 'rfp' ? 'RFP 추출' : '사용자 입력' }}
                </UiBadge>
              </div>
            </template>
          </draggable>
          <UiEmpty
            v-else-if="!isLoading"
            title="목차가 없습니다. 상단 ⋮ 메뉴의 [RFP 데이터 추출] 또는 직접 추가하세요."
          />
        </div>
      </div>

      <!-- 요구사항 탭 -->
      <div
        v-show="activeTab === 'req'"
        class="pt-step-b-tab"
      >
        <div
          v-if="confirmNeededCount"
          class="pt-alertbar"
        >
          ⚠ 확인이 필요한 요구사항이 {{ confirmNeededCount }}건 있습니다.
          <UiButton
            variant="outline"
            size="xs"
            @click="isConfirmNeededOnly = !isConfirmNeededOnly"
          >
            <template #icon-left>
              <UiIcon
                :name="isConfirmNeededOnly ? 'list' : 'filter'"
                size="14"
              />
            </template>
            {{ isConfirmNeededOnly ? '전체 보기' : '확인 필요만 보기' }}
          </UiButton>
        </div>
        <div class="pt-toolbar">
          <div
            class="pt-tab-usage-hint"
            role="note"
          >
            <UiIcon
              name="info"
              size="16"
              aria-hidden="true"
            />
            <p class="pt-tab-usage-hint__text">
              소목차에 매핑되어 슬라이드 본문 작성에 쓰입니다. 현황·이슈가 없을 때는 문제정의 근거로도 활용됩니다.
            </p>
          </div>
          <UiButton
            variant="primary-line"
            size="sm"
            @click="onAddReq"
          >
            + 요구사항 수동 추가
          </UiButton>
        </div>
        <div class="pt-req-table-wrap">
          <UiTable
            :columns="reqColumns"
            :data="visibleRequirements"
            size="sm"
            sticky-header
            max-height="100%"
            empty-text="요구사항이 없습니다. 상단 ⋮ 메뉴의 [RFP 데이터 추출] 또는 수동 추가하세요."
            selected-row-key="requirementId"
            :selected-row-value="focusId ?? undefined"
          >
            <template #header-mandatoryYn>
              <span class="pt-req-mandatory-header">
                필수
                <UiTooltip
                  font-size="11px"
                  side="bottom"
                  align="center"
                  content="필수 요구사항은 목차·슬라이드 작성 시 우선 반영되며, 누락되지 않도록 배정됩니다."
                  content-class="pt-req-mandatory-tooltip"
                >
                  <button
                    type="button"
                    class="pt-req-mandatory-info"
                    aria-label="필수 안내"
                  >
                    <UiIcon
                      name="info"
                      size="15"
                    />
                  </button>
                </UiTooltip>
              </span>
            </template>
            <template #cell-reqNo="{ row }">
              <span :id="'req-' + row.requirementId">{{ row.reqNo || '—' }}</span>
            </template>
            <template #cell-reqCategoryTxt="{ row }">
              <UiBadge
                variant="default"
                size="sm"
              >
                {{ row.reqCategoryTxt || '미분류' }}
              </UiBadge>
            </template>
            <template #cell-reqContent="{ row }">
              <span
                class="pt-req-content-text"
                :title="row.reqContent"
              >
                {{ row.reqContent }}
              </span>
            </template>
            <template #cell-mandatoryYn="{ row }">
              <UiBadge
                :variant="row.mandatoryYn === 'Y' ? 'success' : 'default'"
                size="sm"
              >
                {{ row.mandatoryYn === 'Y' ? '필수' : '선택' }}
              </UiBadge>
            </template>
            <template #cell-sourceTypeCd="{ row }">
              <UiBadge
                :variant="sourceBadgeVariant(row.sourceTypeCd)"
                size="sm"
              >
                {{ sourceLabel(row.sourceTypeCd) }}
              </UiBadge>
            </template>
            <template #cell-_actions="{ row }">
              <div class="pt-req-actions">
                <UiButton
                  variant="ghost"
                  size="xs"
                  icon-only
                  title="수정"
                  aria-label="요구사항 수정"
                  @click="openReqEdit(row as PtRequirement)"
                >
                  <template #icon-left>
                    <UiIcon
                      name="pencil"
                      size="14"
                    />
                  </template>
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="xs"
                  icon-only
                  class="pt-btn-del"
                  title="삭제"
                  aria-label="요구사항 삭제"
                  @click="onDeleteReq(row.requirementId)"
                >
                  <template #icon-left>
                    <UiIcon
                      name="trash-2"
                      size="14"
                    />
                  </template>
                </UiButton>
              </div>
            </template>
          </UiTable>
        </div>

        <!-- 요구사항 추가/수정 모달 -->
        <UiModal
          :is-open="isReqEditOpen"
          :title="editingReq ? '요구사항 수정' : '요구사항 추가'"
          max-width="720px"
          custom-class="pt-req-edit-modal"
          @close="closeReqEdit"
        >
          <div class="pt-req-edit-form">
            <div class="pt-req-edit-meta">
              <UiBadge
                :variant="sourceBadgeVariant(editingReq?.sourceTypeCd || '999')"
                size="sm"
              >
                {{ sourceLabel(editingReq?.sourceTypeCd || '999') }}
              </UiBadge>
            </div>

            <div class="pt-req-edit-row">
              <div class="pt-req-edit-field pt-req-edit-field--no">
                <label class="pt-req-edit-label">번호</label>
                <UiInput
                  v-model="editReqNo"
                  size="md"
                  placeholder="예: REQ-001"
                />
              </div>
              <div class="pt-req-edit-field pt-req-edit-field--cat">
                <label class="pt-req-edit-label">분류</label>
                <UiSelect
                  :model-value="editReqCategorySelect"
                  :options="reqCategoryOptions"
                  placeholder="분류를 선택해주세요"
                  size="md"
                  @update:model-value="onCategorySelect"
                />
                <UiInput
                  v-if="isCategoryCustom"
                  v-model="editReqCategoryCustom"
                  size="md"
                  placeholder="분류를 직접 입력하세요"
                />
              </div>
            </div>

            <div class="pt-req-edit-field">
              <label class="pt-req-edit-label">요구사항 명칭</label>
              <UiTextarea
                v-model="editReqContent"
                class="pt-req-edit-textarea pt-req-edit-textarea--name"
                :rows="2"
                :auto-resize="false"
                border
                size="md"
                placeholder="요구사항 명칭을 입력하세요"
              />
            </div>

            <div class="pt-req-edit-field">
              <label class="pt-req-edit-label">세부내용</label>
              <UiTextarea
                v-model="editReqDetailTxt"
                class="pt-req-edit-textarea pt-req-edit-textarea--detail"
                :rows="6"
                :auto-resize="false"
                border
                size="md"
                placeholder="RFP 상세설명 원문 (없으면 비워두세요)"
              />
            </div>

            <div class="pt-req-edit-field">
              <div class="pt-req-edit-label-row">
                <label class="pt-req-edit-label">필수 여부</label>
                <span class="pt-req-edit-hint">필수 요구사항은 목차·슬라이드 작성 시 우선 반영됩니다.</span>
              </div>
              <div class="pt-toggle-row">
                <button
                  type="button"
                  :class="['pt-toggle-opt', { 'is-active': editMandatoryYn === 'Y' }]"
                  @click="editMandatoryYn = 'Y'"
                >
                  필수
                </button>
                <button
                  type="button"
                  :class="['pt-toggle-opt', { 'is-active': editMandatoryYn === 'N' }]"
                  @click="editMandatoryYn = 'N'"
                >
                  선택
                </button>
              </div>
            </div>
          </div>
          <template #footer>
            <div class="modal-dialog-footer">
              <UiButton
                class="btn-modal-dialog"
                variant="outline"
                size="xlg"
                @click="closeReqEdit"
              >
                취소
              </UiButton>
              <UiButton
                class="btn-modal-dialog"
                variant="primary"
                size="xlg"
                :loading="isReqSaving"
                @click="onReqEditConfirm"
              >
                저장
              </UiButton>
            </div>
          </template>
        </UiModal>
      </div>

      <!-- 평가기준 탭 -->
      <div
        v-show="activeTab === 'ec'"
        class="pt-step-b-tab"
      >
        <div class="pt-toolbar">
          <div
            class="pt-tab-usage-hint"
            role="note"
          >
            <UiIcon
              name="info"
              size="16"
              aria-hidden="true"
            />
            <p class="pt-tab-usage-hint__text">
              소목차와 연결되어 슬라이드 배분·본문 작성 시 평가 관점과 배점을 반영합니다.
            </p>
          </div>
          <UiButton
            variant="primary-line"
            size="sm"
            @click="onAddEc"
          >
            + 평가기준 추가
          </UiButton>
        </div>
        <div
          class="pt-ec-sumbar"
          :class="{ bad: evalScoreSum !== 100 }"
        >
          <b>합계 {{ evalScoreSum }}점</b>
          <span>{{ evalScoreMessage }}</span>
        </div>
        <div class="pt-step-b-scroll-list">
          <div
            v-for="ec in evalCriteria"
            :id="'ec-' + ec.evalCriteriaId"
            :key="ec.evalCriteriaId"
            class="pt-ec-row"
            :class="{
              'is-open': openEcIds.has(ec.evalCriteriaId),
              'is-editing': editingEcId === ec.evalCriteriaId,
            }"
          >
            <div
              class="pt-ec-head"
              role="button"
              tabindex="0"
              :aria-expanded="openEcIds.has(ec.evalCriteriaId)"
              @click="toggleEc(ec.evalCriteriaId)"
              @keydown.enter.prevent="toggleEc(ec.evalCriteriaId)"
              @keydown.space.prevent="toggleEc(ec.evalCriteriaId)"
            >
              <div
                v-if="editingEcId === ec.evalCriteriaId"
                class="pt-ec-score is-editing"
                @click.stop
              >
                <UiInput
                  id="ec-score-edit"
                  v-model="ecDraft.score"
                  number-only
                  size="sm"
                  aria-label="배점"
                />
              </div>
              <div
                v-else
                class="pt-ec-score"
              >
                {{ ec.score }}
              </div>
              <div class="pt-ec-name-wrap">
                <UiInput
                  v-if="editingEcId === ec.evalCriteriaId"
                  id="ec-name-edit"
                  v-model="ecDraft.evalItemNm"
                  class="pt-ec-name-input"
                  size="sm"
                  placeholder="평가기준명"
                  @click.stop
                />
                <span
                  v-else
                  class="pt-ec-name"
                >
                  {{ ec.evalItemNm }}
                </span>
                <UiBadge
                  v-if="editingEcId !== ec.evalCriteriaId"
                  class="pt-ec-fillbadge"
                  :variant="ecFilledCount(ec) === 3 ? 'success' : 'warning'"
                  size="sm"
                >
                  {{ ecFilledCount(ec) === 0 ? '미작성' : `${ecFilledCount(ec)}/3 작성` }}
                </UiBadge>
                <UiButton
                  v-if="editingEcId !== ec.evalCriteriaId"
                  variant="ghost"
                  size="xs"
                  icon-only
                  class="pt-ec-del"
                  aria-label="평가기준 삭제"
                  title="삭제"
                  @click.stop="onDeleteEc(ec.evalCriteriaId)"
                >
                  <template #icon-left>
                    <UiIcon
                      name="trash-2"
                      size="14"
                    />
                  </template>
                </UiButton>
              </div>
              <UiButton
                variant="outline"
                size="xs"
                icon-only
                class="pt-ec-chev"
                :aria-label="openEcIds.has(ec.evalCriteriaId) ? '상세 접기' : '상세 펼치기'"
                @click.stop="toggleEc(ec.evalCriteriaId)"
              >
                <template #icon-left>
                  <UiIcon
                    name="chevron-down"
                    size="16"
                    :class="{ 'is-open': openEcIds.has(ec.evalCriteriaId) }"
                  />
                </template>
              </UiButton>
            </div>
            <div
              v-show="openEcIds.has(ec.evalCriteriaId)"
              class="pt-ec-detail"
            >
              <template v-if="editingEcId === ec.evalCriteriaId">
                <label>평가 의도</label>
                <UiTextarea
                  v-model="ecDraft.evalIntent"
                  :rows="3"
                  :auto-resize="false"
                  border
                  size="md"
                  placeholder="평가 의도를 입력하세요"
                />
                <label>고득점 조건</label>
                <UiTextarea
                  v-model="ecDraft.highScoreCondition"
                  :rows="3"
                  :auto-resize="false"
                  border
                  size="md"
                  placeholder="고득점 조건을 입력하세요"
                />
                <label>필수 증빙</label>
                <UiTextarea
                  v-model="ecDraft.requiredEvidence"
                  :rows="3"
                  :auto-resize="false"
                  border
                  size="md"
                  placeholder="필수 증빙을 입력하세요"
                />
              </template>
              <template v-else>
                <label>평가 의도</label>
                <p
                  class="pt-ec-view-text"
                  :class="{ 'is-empty': !ec.evalIntent }"
                >
                  {{ ec.evalIntent || '내용 없음' }}
                </p>
                <label>고득점 조건</label>
                <p
                  class="pt-ec-view-text"
                  :class="{ 'is-empty': !ec.highScoreCondition }"
                >
                  {{ ec.highScoreCondition || '내용 없음' }}
                </p>
                <label>필수 증빙</label>
                <p
                  class="pt-ec-view-text"
                  :class="{ 'is-empty': !ec.requiredEvidence }"
                >
                  {{ ec.requiredEvidence || '내용 없음' }}
                </p>
              </template>

              <div class="pt-ec-detail-toolbar">
                <template v-if="editingEcId === ec.evalCriteriaId">
                  <UiButton
                    variant="outline"
                    size="sm"
                    :disabled="isEcSaving"
                    @click="onCancelEditEc"
                  >
                    취소
                  </UiButton>
                  <UiButton
                    variant="primary"
                    size="sm"
                    :loading="isEcSaving"
                    @click="onSaveEc"
                  >
                    저장
                  </UiButton>
                </template>
                <UiButton
                  v-else
                  variant="primary-line"
                  size="sm"
                  @click="onStartEditEc(ec)"
                >
                  수정
                </UiButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 현황·이슈 탭 -->
      <div
        v-show="activeTab === 'issue'"
        class="pt-step-b-tab"
      >
        <div class="pt-toolbar">
          <div
            class="pt-tab-usage-hint"
            role="note"
          >
            <UiIcon
              name="info"
              size="16"
              aria-hidden="true"
            />
            <p class="pt-tab-usage-hint__text">
              발주기관의 현황·문제점으로, 전략분석(문제정의·Win Theme)의 핵심 근거로 사용됩니다.
            </p>
          </div>
          <UiButton
            variant="primary-line"
            size="sm"
            @click="onAddIssue"
          >
            + 이슈 수동 추가
          </UiButton>
        </div>
        <div class="pt-step-b-scroll-list">
          <div class="pt-issue-grid">
            <div
              v-for="issue in rfpIssues"
              :id="'issue-' + issue.issueId"
              :key="issue.issueId"
              class="pt-issue-card"
              :class="{
                'is-focus': focusId === issue.issueId,
                'is-editing': editingIssueId === issue.issueId,
              }"
            >
              <div class="pt-issue-top">
                <UiBadge
                  :variant="issueTypeVariant(issue.issueTypeCd)"
                  size="md"
                >
                  {{ issueTypeLabel(issue.issueTypeCd) }}
                </UiBadge>
                <UiInput
                  v-if="editingIssueId === issue.issueId"
                  id="issue-label-edit"
                  v-model="issueDraft.issueLabel"
                  class="pt-issue-label-input"
                  size="sm"
                  placeholder="이슈 제목"
                />
                <span
                  v-else
                  class="pt-issue-label-text"
                >
                  {{ issue.issueLabel || '제목 없음' }}
                </span>
                <div
                  v-if="editingIssueId !== issue.issueId"
                  class="pt-issue-actions"
                >
                  <UiButton
                    variant="ghost"
                    size="xs"
                    icon-only
                    title="수정"
                    aria-label="이슈 수정"
                    @click="onStartEditIssue(issue)"
                  >
                    <template #icon-left>
                      <UiIcon
                        name="pencil"
                        size="14"
                      />
                    </template>
                  </UiButton>
                  <UiButton
                    variant="ghost"
                    size="xs"
                    icon-only
                    class="pt-btn-del"
                    title="삭제"
                    aria-label="이슈 삭제"
                    @click="onDeleteIssue(issue.issueId)"
                  >
                    <template #icon-left>
                      <UiIcon
                        name="trash-2"
                        size="14"
                      />
                    </template>
                  </UiButton>
                </div>
              </div>

              <template v-if="editingIssueId === issue.issueId">
                <UiTextarea
                  v-model="issueDraft.issueContent"
                  class="pt-issue-content-edit"
                  :rows="3"
                  :auto-resize="false"
                  border
                  size="md"
                  placeholder="이슈 내용을 입력하세요"
                />
              </template>
              <p
                v-else
                class="pt-issue-view-text"
                :class="{ 'is-empty': !issue.issueContent }"
              >
                {{ issue.issueContent || '내용 없음' }}
              </p>

              <div class="pt-issue-meta">
                출처: {{ issue.sourceSection || '—' }}
                <template v-if="issue.sourcePage"> · {{ issue.sourcePage }}p</template>
              </div>

              <div
                v-if="editingIssueId === issue.issueId"
                class="pt-issue-detail-toolbar"
              >
                <UiButton
                  variant="outline"
                  size="sm"
                  :disabled="isIssueSaving"
                  @click="onCancelEditIssue"
                >
                  취소
                </UiButton>
                <UiButton
                  variant="primary"
                  size="sm"
                  :loading="isIssueSaving"
                  @click="onSaveIssue"
                >
                  저장
                </UiButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="pt-panel-actions pt-step-b-actions">
      <p :class="['pt-step-b-status', { 'is-blocked': tocList.length === 0 }]">
        {{ nextStatusText }}
      </p>
      <UiButton
        variant="primary"
        size="md"
        :disabled="tocList.length === 0"
        @click="emit('next')"
      >
        다음 · 설정 입력
        <template #icon-right>
          <UiIcon
            name="arrow-right"
            size="14"
          />
        </template>
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { UiButton, UiIcon, UiBadge, UiTable, UiTab } from '@leechanyong/ispark-ui'
import { openToast } from '~/composables/useToast'
import { openConfirm } from '~/composables/useDialog'
import { openLoading, updateLoadingText, closeLoading } from '~/composables/useLoading'
import { useProposalToc } from '~/composables/proposal/useProposalToc'
import { useProposalFileStore } from '~/composables/proposal/useProposalFileStore'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import type { PtRequirement, PtEvalCriteria, PtRfpIssue, PtTocItem } from '~/types/proposal'
import type { TableColumn } from '@leechanyong/ispark-ui'
import type { SelectOption } from '~/components/ui/UiSelect.vue'
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'

const STAGE1_STEP_MESSAGES: Record<string, string> = {
  extract: 'RFP 파일에서 텍스트를 추출하는 중...',
  condense: 'RFP 내용을 요약하는 중...',
  prompt: '프롬프트를 준비하는 중...',
  llm: 'AI가 RFP를 분석하는 중...',
  chunk_extract: '대용량 RFP를 분할하여 추출하는 중...',
  chunk: '청크 단위로 분석하는 중...',
  parse: '분석 결과를 검증하는 중...',
  save: '결과를 저장하는 중...',
}

interface Props {
  ptProjectId: string
  modelId: string
  agentId: string
  writingGuidelineJson?: string
  focusTab?: 'toc' | 'req' | 'ec' | 'issue' | null
  focusId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ next: []; 'focus-cleared': [] }>()

const ptProjectIdRef = computed(() => props.ptProjectId)
const { handleUploadPtFile, handleDownloadPtFile } = useProposalFileStore()
const {
  streamExtractStage1,
  fetchSelectPtRfpFile,
  fetchSelectStage1Result,
  fetchUpdateRequirement,
  fetchInsertRequirement,
  fetchDeleteRequirement,
  fetchUpdateEvalCriteria,
  fetchInsertEvalCriteria,
  fetchDeleteEvalCriteria,
  fetchInsertRfpIssue,
  fetchUpdateRfpIssue,
  fetchDeleteRfpIssue,
} = useProposalApi()

const activeTab = ref('toc')
const requirements = ref<PtRequirement[]>([])
const evalCriteria = ref<PtEvalCriteria[]>([])
const rfpIssues = ref<PtRfpIssue[]>([])
const openEcIds = ref(new Set<string>())
const editingEcId = ref<string | null>(null)
const isEcSaving = ref(false)
const ecDraft = ref({
  evalItemNm: '',
  score: '',
  evalIntent: '',
  highScoreCondition: '',
  requiredEvidence: '',
})
const editingIssueId = ref<string | null>(null)
const isIssueSaving = ref(false)
const issueDraft = ref({
  issueLabel: '',
  issueContent: '',
})
const focusId = computed(() => props.focusId)

const focusEcField = (id: string) => {
  nextTick(() => {
    const el = document.getElementById(id) as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  })
}

const focusIssueField = (id: string) => {
  nextTick(() => {
    const el = document.getElementById(id) as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  })
}

const subTabs = computed(() => [
  { label: '목차', value: 'toc', count: tocList.value.length },
  { label: '요구사항', value: 'req', count: requirements.value.length },
  { label: '평가기준', value: 'ec', count: evalCriteria.value.length },
  { label: '현황·이슈', value: 'issue', count: rfpIssues.value.length },
])

const reqColumns: TableColumn[] = [
  { key: 'reqNo', label: '번호', width: '90px', align: 'center', headerAlign: 'center' },
  { key: 'reqCategoryTxt', label: '분류', width: '130px', align: 'center', headerAlign: 'center' },
  { key: 'reqContent', label: '요구사항 명칭', align: 'left', headerAlign: 'left' },
  { key: 'mandatoryYn', label: '필수', width: '84px', align: 'center', headerAlign: 'center' },
  { key: 'sourceTypeCd', label: '출처', width: '80px', align: 'center', headerAlign: 'center' },
  { key: '_actions', label: '', width: '110px', align: 'center', headerAlign: 'center' },
]

const CATEGORY_CUSTOM_VALUE = '__custom__'

const isReqEditOpen = ref(false)
const isReqSaving = ref(false)
const editingReq = ref<PtRequirement | null>(null)
const editReqNo = ref('')
const editReqCategorySelect = ref('')
const editReqCategoryCustom = ref('')
const editReqContent = ref('')
const editReqDetailTxt = ref<string>('')
const editMandatoryYn = ref<'Y' | 'N'>('Y')

/** 분류 비교용 — 앞뒤·연속 공백을 정규화 */
const normalizeCategoryTxt = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim()

/** 목록에 이미 있는 REQ_CATEGORY_TXT (등장 순, 공백 정규화 후 중복 제거) */
const uniqueCategories = computed(() => {
  const seen = new Set<string>()
  const list: string[] = []
  for (const req of requirements.value) {
    const txt = normalizeCategoryTxt(req.reqCategoryTxt)
    if (!txt || seen.has(txt)) continue
    seen.add(txt)
    list.push(txt)
  }
  return list
})

const reqCategoryOptions = computed<SelectOption[]>(() => [
  ...uniqueCategories.value.map((txt) => ({ label: txt, value: txt })),
  { label: '직접 입력', value: CATEGORY_CUSTOM_VALUE },
])

const isCategoryCustom = computed(() => editReqCategorySelect.value === CATEGORY_CUSTOM_VALUE)

const onCategorySelect = (val: string | number) => {
  const next = String(val)
  editReqCategorySelect.value = next
  if (next !== CATEGORY_CUSTOM_VALUE) editReqCategoryCustom.value = ''
}

const initCategoryFields = (categoryTxt: string | null | undefined) => {
  const cat = normalizeCategoryTxt(categoryTxt)
  if (!cat) {
    editReqCategorySelect.value = ''
    editReqCategoryCustom.value = ''
    return
  }
  if (uniqueCategories.value.includes(cat)) {
    editReqCategorySelect.value = cat
    editReqCategoryCustom.value = ''
    return
  }
  editReqCategorySelect.value = CATEGORY_CUSTOM_VALUE
  editReqCategoryCustom.value = cat
}

const resolvedCategoryTxt = () => {
  if (editReqCategorySelect.value === CATEGORY_CUSTOM_VALUE) {
    return normalizeCategoryTxt(editReqCategoryCustom.value) || null
  }
  return normalizeCategoryTxt(editReqCategorySelect.value) || null
}

const rfpInputRef = ref<HTMLInputElement | null>(null)
const rfpFile = ref<File | null>(null)
const savedRfpFileNm = ref<string | null>(null)
const savedRfpPtFileId = ref<string | null>(null)
const isUploading = ref(false)
const isDownloading = ref(false)
const isAnalyzing = ref(false)
const isPromptModalOpen = ref(false)

/** RFP 더보기 메뉴 — 추출·다운로드는 1회성 액션이라 오버플로로 분리 */
const rfpMenuItems = computed<DropdownMenuItemDef[]>(() => [
  {
    value: 'extract',
    label: 'RFP 데이터 추출',
    icon: 'icon-refresh',
    disabled: !savedRfpFileNm.value || isAnalyzing.value,
  },
  {
    value: 'download',
    label: 'RFP 다운로드',
    icon: 'icon-download',
    disabled: !savedRfpPtFileId.value || isDownloading.value,
  },
])

const onRfpMenuSelect = (value: string) => {
  if (value === 'extract') onExtractStage1()
  if (value === 'download') onDownloadRfp()
}

/** RFP는 1개만, 회사정보(카테고리 합산 10MB)보다 큰 용량 허용 */
const MAX_RFP_FILE_COUNT = 1
const MAX_RFP_FILE_MB = 50
const MAX_RFP_FILE_BYTES = MAX_RFP_FILE_MB * 1024 * 1024
const ALLOWED_RFP_EXT_SET = new Set(['pdf'])

const getFileExt = (fileName: string): string => {
  const trimmed = fileName.trim()
  const lastDot = trimmed.lastIndexOf('.')
  if (lastDot < 0 || lastDot === trimmed.length - 1) return ''
  return trimmed.slice(lastDot + 1).toLowerCase()
}

/** 선택·드롭 파일을 검증하고, 통과한 1개만 반환 */
const applyRfpFileValidation = (files: File[]): File | null => {
  if (!files.length) return null

  if (files.length > MAX_RFP_FILE_COUNT) {
    openToast({ message: 'RFP는 1개 파일만 첨부할 수 있습니다.', type: 'warning' })
  }

  const file = files[0]
  if (!file) return null

  const ext = getFileExt(file.name)
  if (!ALLOWED_RFP_EXT_SET.has(ext)) {
    openToast({ message: 'PDF 파일만 첨부할 수 있습니다.', type: 'warning' })
    return null
  }
  if (file.size > MAX_RFP_FILE_BYTES) {
    openToast({ message: `RFP 파일은 최대 ${MAX_RFP_FILE_MB}MB까지 첨부할 수 있습니다.`, type: 'warning' })
    return null
  }
  return file
}

/** 출처가 '확인필요'거나 확인 플래그가 선 요구사항 */
const isConfirmNeededReq = (r: PtRequirement) => r.sourceTypeCd === '003' || r.confirmNeededYn === 'Y'
const confirmNeededCount = computed(() => requirements.value.filter(isConfirmNeededReq).length)

/** 확인 필요 건만 보기 토글 */
const isConfirmNeededOnly = ref(false)
const visibleRequirements = computed(() =>
  isConfirmNeededOnly.value ? requirements.value.filter(isConfirmNeededReq) : requirements.value,
)

// 확인 필요 건이 0이 되면 알림바가 사라져 토글 버튼도 없어지므로 필터를 자동 해제한다
watch(confirmNeededCount, (count) => {
  if (count === 0) isConfirmNeededOnly.value = false
})
const evalScoreSum = computed(() => evalCriteria.value.reduce((a, b) => a + (Number(b.score) || 0), 0))

/** 평가기준 상세 3개 항목 중 채워진 개수 — 접힌 상태에서 미작성 기준을 식별하기 위함 */
const ecFilledCount = (ec: PtEvalCriteria) =>
  [ec.evalIntent, ec.highScoreCondition, ec.requiredEvidence].filter((v) => !!v?.trim()).length

/** 합계 안내 — 불일치면 차이값과 조치 방향까지 알려준다 */
const evalScoreMessage = computed(() => {
  const diff = evalScoreSum.value - 100
  if (diff === 0) return '— RFP 명시 총점(100점)과 일치합니다'
  return diff > 0
    ? `— 총점 100점보다 ${diff}점 많습니다. 각 항목 배점을 낮춰 조정하세요`
    : `— 총점 100점보다 ${-diff}점 부족합니다. 각 항목 배점을 올리거나 기준을 추가하세요`
})

const {
  tocList,
  isLoading,
  handleSelectTocList,
  handleAddTocItem,
  handleUpdateTocTitle,
  handleDeleteTocItem,
  handleReorderToc,
} = useProposalToc(ptProjectIdRef)

/** 하단 액션 좌측 안내 — 다음 버튼 비활성 사유를 노출 */
const nextStatusText = computed(() => {
  if (isLoading.value) return ''
  if (tocList.value.length === 0) return '목차를 1건 이상 추가해야 다음 단계로 진행할 수 있습니다.'
  if (confirmNeededCount.value > 0)
    return `목차 ${tocList.value.length}건 준비됨 · 확인 필요 요구사항 ${confirmNeededCount.value}건`
  return `목차 ${tocList.value.length}건 준비됨`
})

const loadStage1 = async () => {
  const res = await fetchSelectStage1Result(props.ptProjectId)
  if (res.result === 'OK' && res.data) {
    requirements.value = res.data.requirements || []
    evalCriteria.value = res.data.evalCriteria || []
    rfpIssues.value = res.data.rfpIssues || []
  }
}

watch(
  () => props.focusTab,
  (tab) => {
    if (tab) {
      activeTab.value = tab
      nextTick(() => {
        if (props.focusId) {
          const el = document.getElementById(
            `${tab === 'req' ? 'req' : tab === 'issue' ? 'issue' : tab === 'ec' ? 'ec' : 'toc'}-${props.focusId}`,
          )
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        emit('focus-cleared')
      })
    }
  },
  { immediate: true },
)

onMounted(async () => {
  const [, rfpRes] = await Promise.all([handleSelectTocList(), fetchSelectPtRfpFile(props.ptProjectId)])
  await loadStage1()
  if (rfpRes?.result === 'OK' && rfpRes.data?.fileName) {
    savedRfpFileNm.value = rfpRes.data.fileName
    savedRfpPtFileId.value = rfpRes.data.ptFileId || null
  }
})

const onClickRfpDropzone = () => {
  if (rfpFile.value || savedRfpFileNm.value) return
  rfpInputRef.value?.click()
}
const onRfpFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const validated = applyRfpFileValidation(Array.from(input.files ?? []))
  if (validated) rfpFile.value = validated
  input.value = ''
}
const onDropRfp = (e: DragEvent) => {
  if (rfpFile.value || savedRfpFileNm.value) return
  const validated = applyRfpFileValidation(Array.from(e.dataTransfer?.files ?? []))
  if (validated) rfpFile.value = validated
}

const onUploadRfp = async () => {
  if (!rfpFile.value) return
  const validated = applyRfpFileValidation([rfpFile.value])
  if (!validated) {
    rfpFile.value = null
    return
  }
  isUploading.value = true
  const uploadingFileName = rfpFile.value.name
  try {
    const res = await handleUploadPtFile(rfpFile.value, '001', props.ptProjectId)
    if (!res || res.result !== 'OK') {
      openToast({ message: 'RFP 파일 업로드에 실패했습니다.', type: 'error' })
      return
    }
    savedRfpFileNm.value = res.fileName || uploadingFileName
    savedRfpPtFileId.value = res.ptFileId || null
    rfpFile.value = null
    openToast({ message: 'RFP 파일이 업로드되었습니다.' })
  } catch {
    openToast({ message: '업로드 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isUploading.value = false
  }
}

const onDownloadRfp = async () => {
  if (!savedRfpPtFileId.value || isDownloading.value) return
  isDownloading.value = true
  try {
    await handleDownloadPtFile(savedRfpPtFileId.value)
  } finally {
    isDownloading.value = false
  }
}

const onExtractStage1 = async () => {
  const message = props.writingGuidelineJson
    ? '이미 추출된 내역이 존재합니다. 그래도 추출하시겠습니까? 직접 수정한 내용도 사라집니다.'
    : '업로드한 RFP 파일의 데이터를 추출하시겠습니까?'
  const confirmed = await openConfirm({ title: 'RFP 데이터 추출', message })
  if (!confirmed) return

  isAnalyzing.value = true
  openLoading({ text: 'RFP 분석을 시작하는 중...' })
  streamExtractStage1(props.ptProjectId, props.modelId, props.agentId, {
    onProgress: (data) => {
      const msg = STAGE1_STEP_MESSAGES[data.step]
      if (msg) updateLoadingText(msg)
    },
    onDone: async () => {
      closeLoading()
      isAnalyzing.value = false
      openToast({ message: 'RFP 분석이 완료되었습니다.' })
      await Promise.all([handleSelectTocList(), loadStage1()])
    },
    onError: () => {
      closeLoading()
      isAnalyzing.value = false
      openToast({ message: 'RFP 분석 중 오류가 발생했습니다.', type: 'error' })
    },
  })
}

// ===== 목차 접기/펼치기 =====
/** 접힌 대목차 id 집합 — 기본은 전부 펼침 */
const collapsedTocIds = ref(new Set<string>())

/** parentId → 직계 자식 tocId 목록. 목차는 3단계 이상 가능(대목차 > 소분류 > 세부목차) */
const tocChildrenMap = computed(() => {
  const map = new Map<string, string[]>()
  tocList.value.forEach((t) => {
    if (!t.parentId) return
    const siblings = map.get(t.parentId)
    if (siblings) siblings.push(t.tocId)
    else map.set(t.parentId, [t.tocId])
  })
  return map
})
const hasChildToc = (tocId: string) => tocChildrenMap.value.has(tocId)

/** 접힌 노드의 모든 하위 id — 손자 이하까지 재귀로 모아야 전체가 접힌다 */
const hiddenTocIds = computed(() => {
  const hidden = new Set<string>()
  const collect = (tocId: string) => {
    tocChildrenMap.value.get(tocId)?.forEach((childId) => {
      if (hidden.has(childId)) return // 순환 방어
      hidden.add(childId)
      collect(childId)
    })
  }
  collapsedTocIds.value.forEach(collect)
  return hidden
})

const toggleTocCollapse = (tocId: string) => {
  const next = new Set(collapsedTocIds.value)
  if (next.has(tocId)) next.delete(tocId)
  else next.add(tocId)
  collapsedTocIds.value = next
}

// ===== 전체화면 =====
/**
 * 패널을 뷰포트로 확대 — 사이드바·페이지 헤드·스텝퍼가 쓰던 공간을 회수한다.
 * 앱 헤더($z-header: 450)는 그대로 두고 그 아래부터 채운다.
 * 헤더까지 덮으려면 z-index가 모달(451)보다 커져야 하고, 그러면 이 패널에서 연
 * 수정 모달이 패널 뒤로 숨는다. 헤더 56px을 포기하는 쪽이 안전하다.
 */
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const onFullscreenEsc = (e: KeyboardEvent) => {
  // 인라인 편집 중 Esc는 편집 취소가 먼저 처리되어야 하므로 그때는 무시
  if (e.key !== 'Escape' || !isFullscreen.value) return
  if (editingTocId.value || editingEcId.value || editingIssueId.value) return
  isFullscreen.value = false
}

onMounted(() => window.addEventListener('keydown', onFullscreenEsc))
onBeforeUnmount(() => window.removeEventListener('keydown', onFullscreenEsc))

// ===== 목차 제목 인라인 편집 =====
/** 편집 중인 목차 id — 이 행만 input으로 렌더 */
const editingTocId = ref<string | null>(null)
const editingTitle = ref('')
/** 변경 여부 판단용 원본 — 값이 그대로면 저장 API를 호출하지 않는다 */
const editingOrigin = ref('')

/** input이 붙는 즉시 포커스 (함수 ref 고정 identity → mount/unmount에서만 호출) */
const setEditInput = (el: unknown) => {
  const input = el as HTMLInputElement | null
  // preventScroll — 스크롤은 onAddItem이 scrollIntoView로 부드럽게 처리한다
  if (input && document.activeElement !== input) input.focus({ preventScroll: true })
}

const onStartEditTitle = (item: PtTocItem) => {
  editingTocId.value = item.tocId
  editingTitle.value = item.title
  editingOrigin.value = item.title
}

const onCancelEditTitle = () => {
  editingTocId.value = null
}

/**
 * 제목 확정 — Enter / ✓ 버튼 / 바깥 클릭(blur) 공통.
 * blur는 취소가 아니라 저장이다. 실수로 옆을 눌렀을 때 입력을 잃지 않게 하고,
 * 대신 실제로 값이 바뀐 경우에만 토스트로 저장됐음을 알린다. (취소는 Esc / ✕)
 */
const onCommitTitle = async () => {
  const tocId = editingTocId.value
  if (!tocId) return
  const title = editingTitle.value.trim()
  editingTocId.value = null
  if (!title || title === editingOrigin.value) return
  // 실패 시 store가 롤백 + 에러 토스트를 띄우므로, 성공했을 때만 알린다
  const isSaved = await handleUpdateTocTitle(tocId, title)
  if (isSaved) openToast({ message: '목차명을 변경했습니다.' })
}

/**
 * 목차 추가 — 새 항목은 목록 끝(대목차) 또는 부모 뒤(소목차)에 붙어 화면 밖일 수 있다.
 * 추가 직후 편집 상태로 열고 그 행으로 스크롤해, 바로 이름을 입력할 수 있게 한다.
 */
const onAddItem = async (parentId: string | null) => {
  if (parentId && collapsedTocIds.value.has(parentId)) toggleTocCollapse(parentId)
  const created = await handleAddTocItem(parentId)
  if (!created) return

  onStartEditTitle(created)
  await nextTick()
  const row = document.getElementById(`toc-row-${created.tocId}`)
  row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  // 기본값('새 대목차')을 전체 선택해 바로 덮어쓸 수 있게
  row?.querySelector<HTMLInputElement>('input.pt-toc-input')?.select()
}
/** 목차 삭제 — 대목차는 하위 소목차까지 연쇄 삭제되므로 개수를 알려주고 확인받는다 */
const onDeleteItem = async (item: PtTocItem) => {
  const childCount = item.parentId === null ? tocList.value.filter((t) => t.parentId === item.tocId).length : 0
  const ok = await openConfirm({
    title: item.parentId === null ? '대목차 삭제' : '소목차 삭제',
    message: childCount
      ? `'${item.title}' 대목차와 하위 소목차 ${childCount}개가 함께 삭제됩니다. 삭제하시겠습니까?`
      : `'${item.title}'을(를) 삭제하시겠습니까?`,
  })
  if (!ok) return
  await handleDeleteTocItem(item.tocId)
}
const onDragEnd = async () => handleReorderToc()

const sourceLabel = (cd: string) =>
  (({ '001': '명시', '002': '추론', '003': '확인필요', '999': '직접입력' }) as Record<string, string>)[cd] || cd
/** 출처 코드 → ispark UiBadge variant (003=확인필요 / 002=추론 / 그 외) */
const sourceBadgeVariant = (cd: string) => (cd === '003' ? 'warning' : cd === '002' ? 'info' : 'default')
const issueTypeLabel = (cd: string) =>
  (({ '001': '문제점', '002': '개선방향', '003': '배경·필요성' }) as Record<string, string>)[cd] || cd
/** 이슈 유형 코드 → ispark UiBadge variant (001=문제점 / 002=개선방향 / 003=배경·필요성) */
const issueTypeVariant = (cd: string) => (cd === '001' ? 'danger' : cd === '002' ? 'success' : 'warning')

const openReqEdit = (req: PtRequirement) => {
  editingReq.value = req
  editReqNo.value = req.reqNo ?? ''
  initCategoryFields(req.reqCategoryTxt)
  editReqContent.value = req.reqContent
  editReqDetailTxt.value = req.reqDetailTxt ?? ''
  editMandatoryYn.value = req.mandatoryYn
  isReqEditOpen.value = true
}

const closeReqEdit = () => {
  if (isReqSaving.value) return
  isReqEditOpen.value = false
  editingReq.value = null
}

/** 추가/수정 모달 저장 — 신규는 insert, 기존은 update */
const onReqEditConfirm = async () => {
  if (isReqSaving.value) return

  const reqContent = editReqContent.value.trim()
  if (!reqContent) {
    openToast({ message: '요구사항 명칭을 입력하세요.', type: 'warning' })
    return
  }

  const isAdd = !editingReq.value
  const ok = await openConfirm({
    title: isAdd ? '요구사항 추가' : '요구사항 수정',
    message: isAdd ? '입력한 내용으로 요구사항을 추가하시겠습니까?' : '수정한 내용을 저장하시겠습니까?',
  })
  if (!ok) return

  isReqSaving.value = true
  try {
    const payload = {
      reqNo: editReqNo.value.trim() || null,
      reqCategoryTxt: resolvedCategoryTxt(),
      reqContent,
      reqDetailTxt: editReqDetailTxt.value.trim() || null,
      mandatoryYn: editMandatoryYn.value,
    }

    if (isAdd) {
      const res = await fetchInsertRequirement({
        ptProjectId: props.ptProjectId,
        ...payload,
      })
      if (res.result !== 'OK') {
        openToast({ message: '요구사항 추가에 실패했습니다.', type: 'error' })
        return
      }
      await loadStage1()
      openToast({ message: '요구사항이 추가되었습니다.' })
    } else {
      const requirementId = editingReq.value!.requirementId
      const res = await fetchUpdateRequirement({
        requirementId,
        ...payload,
      })
      if (res.result !== 'OK') {
        openToast({ message: '요구사항 수정에 실패했습니다.', type: 'error' })
        return
      }
      await loadStage1()
      openToast({ message: '요구사항이 수정되었습니다.' })
    }

    isReqEditOpen.value = false
    editingReq.value = null
  } finally {
    isReqSaving.value = false
  }
}

const onAddReq = () => {
  editingReq.value = null
  editReqNo.value = ''
  initCategoryFields(null)
  editReqContent.value = ''
  editReqDetailTxt.value = ''
  editMandatoryYn.value = 'Y'
  isReqEditOpen.value = true
}
const onDeleteReq = async (id: string) => {
  const ok = await openConfirm({ title: '요구사항 삭제', message: '이 요구사항을 삭제하시겠습니까?' })
  if (!ok) return
  await fetchDeleteRequirement(id)
  await loadStage1()
}

const toggleEc = (id: string) => {
  // 수정 중에는 접기 방지
  if (editingEcId.value === id && openEcIds.value.has(id)) {
    openToast({ message: '수정 중입니다. 저장 또는 취소 후 접어주세요.', type: 'warning' })
    return
  }
  const next = new Set(openEcIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openEcIds.value = next
}

const onStartEditEc = (ec: PtEvalCriteria) => {
  editingEcId.value = ec.evalCriteriaId
  ecDraft.value = {
    evalItemNm: ec.evalItemNm || '',
    score: String(ec.score ?? ''),
    evalIntent: ec.evalIntent || '',
    highScoreCondition: ec.highScoreCondition || '',
    requiredEvidence: ec.requiredEvidence || '',
  }
  // 수정 진입 시 상세 영역 펼침
  if (!openEcIds.value.has(ec.evalCriteriaId)) {
    const next = new Set(openEcIds.value)
    next.add(ec.evalCriteriaId)
    openEcIds.value = next
  }
  focusEcField('ec-name-edit')
}

const onCancelEditEc = () => {
  if (isEcSaving.value) return
  editingEcId.value = null
}

const onSaveEc = async () => {
  const evalCriteriaId = editingEcId.value
  if (!evalCriteriaId || isEcSaving.value) return

  const evalItemNm = ecDraft.value.evalItemNm.trim()
  if (!evalItemNm) {
    openToast({ message: '평가기준명을 입력하세요.', type: 'warning' })
    focusEcField('ec-name-edit')
    return
  }

  const score = Number(ecDraft.value.score)
  if (ecDraft.value.score === '' || Number.isNaN(score)) {
    openToast({ message: '배점을 입력하세요.', type: 'warning' })
    focusEcField('ec-score-edit')
    return
  }

  const ok = await openConfirm({
    title: '평가기준 수정',
    message: '수정한 내용을 저장하시겠습니까?',
  })
  if (!ok) return

  isEcSaving.value = true
  try {
    const res = await fetchUpdateEvalCriteria({
      evalCriteriaId,
      evalItemNm,
      score,
      evalIntent: ecDraft.value.evalIntent.trim() || null,
      highScoreCondition: ecDraft.value.highScoreCondition.trim() || null,
      requiredEvidence: ecDraft.value.requiredEvidence.trim() || null,
    })
    if (res.result !== 'OK') {
      openToast({ message: '평가기준 수정에 실패했습니다.', type: 'error' })
      return
    }
    await loadStage1()
    editingEcId.value = null
    openToast({ message: '평가기준이 수정되었습니다.' })
  } catch {
    openToast({ message: '평가기준 수정 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isEcSaving.value = false
  }
}

const onAddEc = async () => {
  const res = await fetchInsertEvalCriteria({
    ptProjectId: props.ptProjectId,
    evalItemNm: '새 평가기준',
    score: 0,
  })
  await loadStage1()
  if (res.result === 'OK' && res.data?.evalCriteriaId) {
    const created = evalCriteria.value.find((e) => e.evalCriteriaId === res.data.evalCriteriaId)
    if (created) onStartEditEc(created)
  }
}

const onDeleteEc = async (id: string) => {
  if (editingEcId.value === id) {
    openToast({ message: '수정 중에는 삭제할 수 없습니다. 취소 후 다시 시도하세요.', type: 'warning' })
    return
  }
  const ok = await openConfirm({
    title: '평가기준 삭제',
    message: '이 평가기준을 삭제하시겠습니까? 목차매핑에서 참조 중일 수 있습니다.',
  })
  if (!ok) return
  const res = await fetchDeleteEvalCriteria(id)
  if (res.result !== 'OK') {
    openToast({ message: '평가기준 삭제에 실패했습니다.', type: 'error' })
    return
  }
  await loadStage1()
  openToast({ message: '평가기준이 삭제되었습니다.' })
}

const onStartEditIssue = (issue: PtRfpIssue) => {
  editingIssueId.value = issue.issueId
  issueDraft.value = {
    issueLabel: issue.issueLabel || '',
    issueContent: issue.issueContent || '',
  }
  focusIssueField('issue-label-edit')
}

const onCancelEditIssue = () => {
  if (isIssueSaving.value) return
  editingIssueId.value = null
}

const onSaveIssue = async () => {
  const issueId = editingIssueId.value
  if (!issueId || isIssueSaving.value) return

  const issueLabel = issueDraft.value.issueLabel.trim()
  if (!issueLabel) {
    openToast({ message: '이슈 제목을 입력하세요.', type: 'warning' })
    focusIssueField('issue-label-edit')
    return
  }

  const issueContent = issueDraft.value.issueContent.trim()
  if (!issueContent) {
    openToast({ message: '이슈 내용을 입력하세요.', type: 'warning' })
    return
  }

  const ok = await openConfirm({
    title: '이슈 수정',
    message: '수정한 내용을 저장하시겠습니까?',
  })
  if (!ok) return

  isIssueSaving.value = true
  try {
    const res = await fetchUpdateRfpIssue({
      issueId,
      issueLabel,
      issueContent,
    })
    if (res.result !== 'OK') {
      openToast({ message: '이슈 수정에 실패했습니다.', type: 'error' })
      return
    }
    await loadStage1()
    editingIssueId.value = null
    openToast({ message: '이슈가 수정되었습니다.' })
  } catch {
    openToast({ message: '이슈 수정 중 오류가 발생했습니다.', type: 'error' })
  } finally {
    isIssueSaving.value = false
  }
}

const onAddIssue = async () => {
  const res = await fetchInsertRfpIssue({
    ptProjectId: props.ptProjectId,
    issueTypeCd: '003',
    issueContent: '이슈 내용을 입력하세요',
    issueLabel: '새 이슈',
  })
  await loadStage1()
  activeTab.value = 'issue'
  if (res.result === 'OK' && res.data?.issueId) {
    const created = rfpIssues.value.find((i) => i.issueId === res.data.issueId)
    if (created) onStartEditIssue(created)
  }
}

const onDeleteIssue = async (id: string) => {
  if (editingIssueId.value === id) {
    openToast({ message: '수정 중에는 삭제할 수 없습니다. 취소 후 다시 시도하세요.', type: 'warning' })
    return
  }
  const ok = await openConfirm({
    title: '이슈 삭제',
    message: '이 이슈를 삭제하시겠습니까?',
  })
  if (!ok) return
  const res = await fetchDeleteRfpIssue(id)
  if (res.result !== 'OK') {
    openToast({ message: '이슈 삭제에 실패했습니다.', type: 'error' })
    return
  }
  await loadStage1()
  openToast({ message: '이슈가 삭제되었습니다.' })
}
</script>

<style lang="scss" scoped>
.pt-panel.pt-step-b {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: $spacing-md $spacing-lg;

  /* 전체화면 — z-index는 사이드바(1) 위, 드롭다운 포털($z-dropdown: 100)·모달·토스트 아래.
     포털로 띄우는 메뉴/모달이 패널 뒤로 숨지 않도록 일부러 낮게 잡는다. */
  &.is-fullscreen {
    position: fixed;
    top: $header-height;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10;
    margin: 0;
    border: none;
    border-radius: 0;
  }
}

/*
 * 제목 → 설명 → 액션 순으로 전부 좌측 정렬.
 * 패널이 화면 전폭(1800px+)이라 액션을 우측 끝으로 보내면 설명에서 버튼까지 시선이 너무 멀고,
 * 제목과 설명 사이에 두면 문장이 끊겨 읽힌다. 설명 뒤가 둘 다 피하는 자리.
 */
.pt-step-b-head {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-shrink: 0;
  margin-bottom: $spacing-sm;

  .pt-panel-title {
    @include typo($body-medium-bold);
    margin: 0;
    flex-shrink: 0;
  }

  .pt-panel-desc {
    @include typo($body-small);
    margin: 0;
    min-width: 0; /* flex 자식 축소 허용 — 없으면 말줄임이 안 걸린다 */
    @include ellipsis(1);
    margin-right: $spacing-xs; /* 설명과 액션 사이 최소 간격 */
  }

  .ui-button {
    flex-shrink: 0;
  }
}

/* RFP 파일 상태 + 파일 액션 묶음 — 헤더 우측 끝 (⋮는 대상인 파일 칩과 붙어 다닌다) */
.pt-step-b-rfp {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-shrink: 0;
  margin-left: auto;
}

.pt-step-b-dropzone {
  flex: 0 1 auto;
  min-width: 0;
  margin-bottom: 0;
  /* 헤더 행의 UiButton(size=sm, 30px)과 높이 일치 */
  min-height: 30px;
  padding: 0 12px;
  justify-content: flex-start;
  text-align: left;
  @include typo($body-small);

  /* 미첨부 상태는 드롭 타깃이므로 최소 폭 확보 — 확정 후에는 클릭·드롭이 막혀 내용 폭이면 충분 */
  &:not(.is-filled) {
    min-width: 300px;
  }
}

.pt-step-b-rfp .pt-rfp-btn-row {
  margin: 0;
  flex-shrink: 0;
  gap: 8px;
}

.pt-step-b-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 로컬 UiTab 시절의 기본값(max-width 800px·중앙정렬)을 되돌리던 override는 제거.
   ispark UiTab은 기본이 full-width·무패딩이고 정렬은 align prop으로 준다. */
.pt-step-b-tabs {
  flex-shrink: 0;
  margin: $spacing-md 0 $spacing-md;
}

.pt-step-b-tab {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;

  overflow: hidden;
}

.pt-step-b-actions {
  flex-shrink: 0;
  margin-top: 0;
  padding-top: $spacing-md;
  border-top: 1px solid $color-border;
  justify-content: space-between;
  gap: $spacing-md;
}

.pt-step-b-status {
  margin: 0;
  align-self: center;
  @include typo($body-small, $color-text-muted);

  &.is-blocked {
    color: $color-warning;
  }
}

.pt-step-b-scroll-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  @include custom-scrollbar;
}

.pt-req-table-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;

  :deep(.ui-table-wrap) {
    flex: 1;
    min-height: 0;
    height: 100%;
    max-height: none;
    overflow: auto;
    overscroll-behavior: contain;
    @include custom-scrollbar;
  }

  :deep(.ui-table thead.is-sticky th) {
    background: #f4f7f9;
  }

  :deep(.ui-table tbody td) {
    height: auto;
    min-height: 44px;
    padding: 10px 12px;
    vertical-align: middle;
  }

  // 내용 컬럼: 좌측 정렬 + 여유 패딩
  :deep(.ui-table tbody td:nth-child(3)) {
    text-align: left;
    padding: 12px 16px;
  }

  :deep(.pt-badge) {
    white-space: nowrap;
  }
}

.pt-req-content-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: left;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
}

.pt-req-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;

  /* 삭제만 hover 시 danger — ispark ghost hover(6단계)를 넘기려 선택자를 길게 잡는다 */
  .pt-btn-del.ui-button.variant-ghost:hover:not(:disabled) {
    color: $color-error;
    background-color: rgba($color-error, 0.08);
  }
}

.pt-req-mandatory-header {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* 헤더 안내 아이콘 — muted + 12px이면 헤더 텍스트에 묻혀 안 보인다 */
.pt-req-mandatory-info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-primary);
  cursor: help;

  &:hover {
    color: var(--color-primary-dark);
  }
}

.pt-req-edit-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.pt-req-edit-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  background: $color-surface;
  border: 1px solid $color-border-light;
  border-radius: $border-radius-base;
}

.pt-req-edit-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: $spacing-md;
}

.pt-req-edit-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.pt-req-edit-label-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.pt-req-edit-label {
  @include typo($body-small-bold);
  color: $color-text-heading;
}

.pt-req-edit-hint {
  @include typo($body-small);
  color: $color-text-muted;
}

.pt-req-edit-textarea {
  width: 100%;
  line-height: 1.55;

  &--name {
    min-height: 64px;
  }

  &--detail {
    min-height: 220px;
  }
}

.pt-tab-usage-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  min-width: 0;

  // UiIcon은 svg로 렌더됨 — 텍스트는 중립색이고 파란 아이콘이 '안내' 신호를 담당
  > svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--color-primary);
  }
}

.pt-toolbar {
  flex-shrink: 0;
  margin-top: $spacing-md;
  margin-bottom: $spacing-sm;
}

.pt-toc-toolbar,
.pt-alertbar,
.pt-ec-sumbar {
  flex-shrink: 0;
}

.pt-toolbar .pt-tab-usage-hint {
  flex: 1;
  margin: 0;
  align-items: center;
  padding-right: 12px;

  > svg {
    margin-top: 0;
  }
}

/* 12px + primary 파랑은 흰 배경에서 대비가 낮아 읽기 어려움 → 14px 중립색, 강조는 아이콘이 담당 */
.pt-tab-usage-hint__text {
  margin: 0;
  @include typo($body-small);
  color: $color-text-muted;
}
</style>

<style lang="scss">
// Radix 포탈용 — scoped 불가
.pt-req-mandatory-tooltip {
  max-width: 260px;
}

.pt-req-edit-modal {
  .modal-dialog-body {
    align-items: stretch;
    width: 100%;
  }

  .pt-req-edit-form {
    width: 100%;
  }

  .pt-req-edit-textarea.ui-textarea {
    line-height: 1.55;

    &.pt-req-edit-textarea--name {
      min-height: 64px;
    }

    &.pt-req-edit-textarea--detail {
      min-height: 220px;
    }
  }
}
</style>
