<template>
  <div class="guide-page">
    <NuxtLink to="/guide" class="guide-back">← 가이드 목록</NuxtLink>
    <h1 class="guide-title">UiTab</h1>
    <p class="guide-description">v-model 지원 탭 컴포넌트</p>

    <!-- 기본 사용 -->
    <section class="guide-section">
      <h2 class="section-title">기본 사용</h2>
      <div class="guide-demo">
        <p class="demo-label">선택된 탭: {{ activeTab }}</p>
        <div class="demo-box">
          <UiTab
            v-model="activeTab"
            :tabs="basicTabs"
          />
        </div>
        <pre class="demo-code">&lt;UiTab
  v-model="activeTab"
  :tabs="[
    { label: '전체', value: 'all' },
    { label: '활성', value: 'active' },
    { label: '비활성', value: 'inactive' },
  ]"
/&gt;</pre>
      </div>
    </section>

    <!-- 탭 + 콘텐츠 전환 -->
    <section class="guide-section">
      <h2 class="section-title">콘텐츠 전환</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiTab
            v-model="contentTab"
            :tabs="contentTabs"
          />
          <div style="padding: 16px; color: #4d5462;">
            <p v-if="contentTab === 'info'">정보 탭 콘텐츠입니다.</p>
            <p v-else-if="contentTab === 'setting'">설정 탭 콘텐츠입니다.</p>
            <p v-else>기록 탭 콘텐츠입니다.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Props -->
    <section class="guide-section">
      <h2 class="section-title">Props</h2>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>Prop</th>
            <th>타입</th>
            <th>기본값</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>modelValue</td>
            <td>string</td>
            <td>-</td>
            <td>v-model 바인딩 (선택된 탭 value)</td>
          </tr>
          <tr>
            <td>tabs</td>
            <td>{ label: string, value: string }[]</td>
            <td>-</td>
            <td>탭 목록</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
const activeTab = ref('all')
const basicTabs = [
  { label: '전체', value: 'all' },
  { label: '활성', value: 'active' },
  { label: '비활성', value: 'inactive' },
]

const contentTab = ref('info')
const contentTabs = [
  { label: '정보', value: 'info' },
  { label: '설정', value: 'setting' },
  { label: '기록', value: 'history' },
]
</script>
