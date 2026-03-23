<template>
  <div class="com-setting-section">
    <div class="com-setting-section-title">Agent 기본 설정</div>

    <!-- Agent 이름 -->
    <div class="com-setting-field-row">
      <label class="com-setting-label">Agent 이름</label>
      <UiInput
        :model-value="modelValue.agentNm"
        placeholder="예: GPT-4o"
        size="sm"
        @update:model-value="onUpdate('agentNm', $event)"
      />
    </div>

    <!-- Agent 설명 -->
    <div class="com-setting-field-row is-top">
      <label class="com-setting-label">
        <span class="is-required">*</span>
        Agent 설명
      </label>
      <UiTextarea
        :model-value="modelValue.description"
        placeholder="등록된 매뉴얼과 문서를 기반으로 사용자 질문에 답변하는 Agent입니다."
        :rows="2"
        size="sm"
        :border="true"
        :auto-resize="true"
        :max-rows="5"
        @update:model-value="onUpdate('description', $event)"
      />
    </div>

    <!-- RAG 설정 (001) -->
    <div
      v-if="agentTypeCd === '001'"
      class="com-setting-row type-config-row"
    >
      <div class="type-config-col">
        <label class="com-setting-label">유사도 임계값</label>
        <div class="com-setting-inline">
          <UiInput
            :model-value="ragForm.simThresh"
            placeholder="0.0"
            size="sm"
            number-only
            allow-decimal
            @update:model-value="onRagUpdate('simThresh', Number($event))"
          />
          <span class="com-setting-unit">(0.0 ~ 1.0)</span>
        </div>
        <span class="com-setting-hint">이 값 이상의 유사도를 가진 문서만 검색</span>
      </div>
      <div class="type-config-col">
        <label class="com-setting-label">최대 검색 결과</label>
        <div class="com-setting-inline">
          <UiInput
            :model-value="ragForm.maxSrchRslt"
            placeholder="0"
            size="sm"
            number-only
            @update:model-value="onRagUpdate('maxSrchRslt', Number($event))"
          />
          <span class="com-setting-unit">개</span>
        </div>
        <span class="com-setting-hint">최대로 검색할 문서 청크 수</span>
      </div>
    </div>

    <!-- SQL 설정 (002) -->
    <template v-if="agentTypeCd === '002'">
      <div class="com-setting-row type-config-row">
        <div class="type-config-col">
          <label class="com-setting-label">SQL 생성 모델</label>
          <UiSelect
            :model-value="sqlForm.modelId"
            :options="sqlModelOptions"
            placeholder="모델을 선택하세요"
            size="sm"
            @update:model-value="onSqlUpdate('modelId', $event)"
          />
        </div>
        <div class="type-config-col">
          <label class="com-setting-label">최대 쿼리 실행 시간</label>
          <div class="com-setting-inline">
            <UiInput
              :model-value="sqlForm.maxQrySec"
              placeholder="0"
              size="sm"
              number-only
              @update:model-value="onSqlUpdate('maxQrySec', Number($event))"
            />
            <span class="com-setting-unit">초</span>
          </div>
        </div>
      </div>
      <div class="sql-checkbox-col type-config-row">
        <UiCheckbox
          :model-value="sqlForm.sqlValidYn === 'Y'"
          label="SQL 쿼리 검증 활성화"
          @update:model-value="onSqlUpdate('sqlValidYn', $event ? 'Y' : 'N')"
        />
        <UiCheckbox
          :model-value="sqlForm.readonlyYn === 'Y'"
          label="읽기 전용 모드 (SELECT만 허용)"
          @update:model-value="onSqlUpdate('readonlyYn', $event ? 'Y' : 'N')"
        />
        <UiCheckbox
          :model-value="sqlForm.userCfrmYn === 'Y'"
          label="실행 전 사용자 확인 요청"
          @update:model-value="onSqlUpdate('userCfrmYn', $event ? 'Y' : 'N')"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface BasicForm {
  agentNm: string
  description: string
}

interface RagForm {
  simThresh: number
  maxSrchRslt: number
}

interface SqlForm {
  modelId: string
  maxQrySec: number
  sqlValidYn: 'Y' | 'N'
  readonlyYn: 'Y' | 'N'
  userCfrmYn: 'Y' | 'N'
}

interface Props {
  modelValue: BasicForm
  agentTypeCd: string
  ragForm: RagForm
  sqlForm: SqlForm
  sqlModelOptions: { value: string; label: string }[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: BasicForm]
  'update:ragForm': [value: RagForm]
  'update:sqlForm': [value: SqlForm]
}>()

const onUpdate = (key: keyof BasicForm, value: string | number) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const onRagUpdate = (key: keyof RagForm, value: number) => {
  emit('update:ragForm', { ...props.ragForm, [key]: value })
}

const onSqlUpdate = (key: keyof SqlForm, value: string | number | 'Y' | 'N') => {
  emit('update:sqlForm', { ...props.sqlForm, [key]: value })
}
</script>

<style lang="scss" scoped>
.type-config-row {
  margin-left: calc(var(--label-width) + 12px);
}

.type-config-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .com-setting-label {
    width: auto;
    text-align: left;
  }

  .com-setting-hint {
    margin-top: 0;
  }

  .ui-select-wrap {
    width: 100%;
  }
}

.sql-checkbox-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
