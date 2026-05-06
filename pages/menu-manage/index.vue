<template>
  <div class="menu-manage-index">
    <!-- 탭 -->
    <UiTab
      v-model="activeTab"
      :tabs="tabItems"
    />

    <!-- 메인 컨텐츠 -->
    <div class="menu-manage-main l-center">
      <MenuManagePage v-show="activeTab === 'menu'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MenuManagePage from '~/components/menu-manage/MenuManagePage.vue'

definePageMeta({ layout: 'default' })

const { handleFetchMenuManageTree } = useMenuManageStore()

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const activeTab = ref('menu')
const tabItems = [{ label: '메뉴 관리', value: 'menu' }]

onMounted(() => {
  handleFetchMenuManageTree()
})
</script>
