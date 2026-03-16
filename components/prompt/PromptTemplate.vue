<template>
  <div class="prompt-template">
    <div class="prompt-box">
      <!-- 헤더 -->
      <div class="prompt-box-header">
        <div class="prompt-box-title">
          <span class="prompt-box-name">프롬프트 템플릿</span>
          <span class="prompt-box-sub">자주 사용하는 질문/응답 템플릿을 관리합니다.</span>
        </div>
        <UiButton
          variant="secondary"
          size="sm"
          @click="onAdd"
        >
          <template #icon-left>
            <i class="icon-plus size-16" />
          </template>
          새 템플릿
        </UiButton>
      </div>

      <!-- 카테고리 필터 -->
      <div class="prompt-template-filter">
        <button
          v-for="cat in categoryFilters"
          :key="cat.value"
          class="prompt-template-filter-btn"
          :class="{ 'is-active': activeCategory === cat.value }"
          @click="activeCategory = cat.value"
        >
          {{ cat.label }} <strong>{{ cat.count }}개</strong>
        </button>
      </div>

      <!-- 템플릿 목록 -->
      <div class="prompt-template-list">
        <PromptTemplateCard
          v-for="item in filteredList"
          :key="item.id"
          :template="item"
          @edit="onEdit"
          @delete="onDelete"
        />
      </div>
    </div>

    <!-- 삭제 확인 모달 -->
    <UiDialogModal
      :is-open="isDeleteModalOpen"
      title="템플릿 삭제"
      :message="`'${deletingTemplate?.name}' 템플릿을 삭제하시겠습니까?`"
      confirm-text="삭제"
      @close="isDeleteModalOpen = false"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { PromptTemplate } from '~/types/prompt'
import { usePromptStore } from '~/composables/prompt/usePromptStore'

const { templateList, handleSelectTemplateList, handleDeleteTemplate } = usePromptStore()

// 초기 조회
onMounted(() => handleSelectTemplateList())

// 카테고리 필터
const activeCategory = ref('all')

const categories = computed(() => {
  const cats = new Set(templateList.value.map((t) => t.category))
  return Array.from(cats)
})

const categoryFilters = computed(() => {
  const all = { label: '전체', value: 'all', count: templateList.value.length }
  const items = categories.value.map((cat) => ({
    label: cat,
    value: cat,
    count: templateList.value.filter((t) => t.category === cat).length,
  }))
  return [all, ...items]
})

const filteredList = computed(() => {
  if (activeCategory.value === 'all') return templateList.value
  return templateList.value.filter((t) => t.category === activeCategory.value)
})

// 추가
const onAdd = () => {
  console.warn('[TODO] 템플릿 추가 모달')
}

// 수정
const onEdit = (template: PromptTemplate) => {
  console.warn('[TODO] 템플릿 수정 모달', template)
}

// 삭제
const isDeleteModalOpen = ref(false)
const deletingTemplate = ref<PromptTemplate | null>(null)

const onDelete = (template: PromptTemplate) => {
  deletingTemplate.value = template
  isDeleteModalOpen.value = true
}

const doDelete = async () => {
  if (!deletingTemplate.value) return
  await handleDeleteTemplate(deletingTemplate.value.id)
  isDeleteModalOpen.value = false
  deletingTemplate.value = null
}
</script>
