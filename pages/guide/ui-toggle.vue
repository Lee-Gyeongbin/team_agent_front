<template>
  <div class="guide-page">
    <NuxtLink to="/guide" class="guide-back">← 가이드 목록</NuxtLink>
    <h1 class="guide-title">UiToggle</h1>
    <p class="guide-description">v-model 지원 토글 스위치</p>

    <!-- 기본 사용 -->
    <section class="guide-section">
      <h2 class="section-title">기본 사용</h2>
      <div class="guide-demo">
        <p class="demo-label">v-model: {{ active }}</p>
        <div class="demo-box">
          <div style="display: flex; align-items: center; gap: 12px;">
            <UiToggle v-model="active" />
            <span style="font-size: 14px; color: #4d5462;">{{ active ? '활성' : '비활성' }}</span>
          </div>
        </div>
        <pre class="demo-code">&lt;UiToggle v-model="active" /&gt;</pre>
      </div>
    </section>

    <!-- 여러 개 -->
    <section class="guide-section">
      <h2 class="section-title">여러 토글</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div v-for="item in toggleList" :key="item.label" style="display: flex; align-items: center; gap: 12px;">
              <UiToggle v-model="item.value" />
              <span style="font-size: 14px; color: #4d5462;">{{ item.label }}: {{ item.value ? 'ON' : 'OFF' }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Props 정리 -->
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
            <td>boolean</td>
            <td>-</td>
            <td>v-model 바인딩</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
const active = ref(true)

const toggleList = reactive([
  { label: '알림', value: true },
  { label: '다크모드', value: false },
  { label: '자동저장', value: true },
])
</script>
