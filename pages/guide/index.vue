<template>
  <div class="guide-page">
    <h1 class="guide-title">UI Guide</h1>
    <p class="guide-description">프로젝트 작업현황, 디자인 토큰, UI 컴포넌트, 글로벌 스타일 가이드</p>

    <!-- ============================================ -->
    <!-- 섹션 1: 작업 현황 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">1. 작업 현황</h2>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>항목</th>
            <th>URL / 위치</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in statusList"
            :key="item.name"
          >
            <td>{{ item.category }}</td>
            <td>{{ item.name }}</td>
            <td>
              <a
                v-if="item.url"
                :href="item.url"
                target="_blank"
                class="status-link"
                >{{ item.location }}</a
              >
              <span v-else>{{ item.location }}</span>
            </td>
            <td :class="item.done ? 'status-done' : 'status-pending'">
              {{ item.done ? '✅ 완료' : '⬜ 미완' }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ============================================ -->
    <!-- 섹션 2: 디자인 토큰 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">2. 디자인 토큰</h2>

      <!-- 색상 -->
      <h3 class="section-subtitle">색상 (Colors)</h3>
      <div class="guide-tokens">
        <div class="token-row">
          <div
            v-for="color in colorTokens"
            :key="color.name"
            class="guide-swatch"
          >
            <div
              class="swatch-box"
              :style="{ background: color.value }"
            />
            <span class="swatch-label">{{ color.name }}</span>
            <span class="swatch-value">{{ color.value }}</span>
          </div>
        </div>
      </div>

      <!-- 타이포그래피 -->
      <h3 class="section-subtitle">타이포그래피 (Typography)</h3>
      <div class="guide-tokens">
        <div
          v-for="typo in typoTokens"
          :key="typo.name"
          class="guide-typo-item"
        >
          <span class="typo-label">{{ typo.name }} ({{ typo.size }})</span>
          <span
            class="typo-preview"
            :style="{ fontSize: typo.size }"
          >
            다람쥐 헌 쳇바퀴에 타고파 ABCabc 123
          </span>
        </div>
      </div>

      <!-- 간격 -->
      <h3 class="section-subtitle">간격 (Spacing)</h3>
      <div class="guide-tokens">
        <div
          v-for="sp in spacingTokens"
          :key="sp.name"
          class="guide-spacing-item"
        >
          <span class="spacing-label">{{ sp.name }}</span>
          <div
            class="spacing-bar"
            :style="{ width: sp.value }"
          />
          <span class="spacing-value">{{ sp.value }}</span>
        </div>
      </div>

      <!-- 둥글기 -->
      <h3 class="section-subtitle">둥글기 (Border Radius)</h3>
      <div class="guide-tokens">
        <div class="token-row">
          <div
            v-for="r in radiusTokens"
            :key="r.name"
            class="guide-radius-item"
          >
            <div
              class="radius-box"
              :style="{ borderRadius: r.value }"
            />
            <span class="radius-label">{{ r.name }} ({{ r.value }})</span>
          </div>
        </div>
      </div>

      <!-- 그림자 -->
      <h3 class="section-subtitle">그림자 (Shadows)</h3>
      <div class="guide-tokens">
        <div class="token-row">
          <div
            v-for="s in shadowTokens"
            :key="s.name"
            class="guide-shadow-item"
          >
            <div
              class="shadow-box"
              :style="{ boxShadow: s.value }"
            />
            <span class="shadow-label">{{ s.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 섹션 3: UI 컴포넌트 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">3. UI 컴포넌트</h2>

      <div class="guide-component-grid">
        <NuxtLink
          v-for="comp in componentList"
          :key="comp.name"
          :to="comp.to"
          class="component-card"
        >
          <div class="component-card-header">
            <span class="component-card-name">{{ comp.name }}</span>
            <span class="component-card-arrow">→</span>
          </div>
          <p class="component-card-desc">{{ comp.description }}</p>
          <div class="component-card-tags">
            <span
              v-for="tag in comp.tags"
              :key="tag"
              class="component-card-tag"
              >{{ tag }}</span
            >
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 섹션 4: 아이콘 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">4. 아이콘</h2>

      <div class="guide-demo">
        <p class="demo-label">등록된 아이콘</p>
        <div class="demo-box">
          <div class="guide-icon-grid">
            <div
              v-for="icon in iconList"
              :key="icon.class"
              class="icon-item"
            >
              <i :class="[icon.class, 'size-24']" />
              <span class="icon-name">.{{ icon.class }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="guide-demo">
        <p class="demo-label">사이즈 클래스 비교</p>
        <div class="demo-box">
          <div style="display: flex; align-items: center; gap: 16px">
            <span
              v-for="size in [12, 16, 20, 24, 28, 32, 36, 40, 48]"
              :key="size"
              style="display: flex; flex-direction: column; align-items: center; gap: 4px"
            >
              <i :class="['icon-ai-chat', `size-${size}`]" />
              <span style="font-size: 11px; color: #64748b">.size-{{ size }}</span>
            </span>
          </div>
        </div>
        <pre class="demo-code">
&lt;i class="icon-ai-chat size-24" /&gt;
&lt;i class="icon-ai-chat size-32" /&gt;
&lt;i class="icon-ai-chat size-48" /&gt;</pre
        >
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================

// 섹션 1: 작업 현황
// url: 클릭 시 새 창으로 열 수 있는 경로 (동적 파라미터 포함 URL은 제외)
const statusList = [
  { category: '페이지', name: '채팅 메인', location: '/chat', url: '/chat', done: true },
  { category: '페이지', name: '채팅 상세', location: '/chat/:id', url: '', done: false },
  { category: '페이지', name: '에이전트 목록', location: '/agents', url: '/agents', done: false },
  { category: '페이지', name: '에이전트 생성', location: '/agents/new', url: '/agents/new', done: false },
  { category: '페이지', name: '에이전트 상세', location: '/agents/:id', url: '', done: false },
  { category: '페이지', name: '엑셀 뷰어', location: '/excel', url: '/excel', done: true },
  { category: '페이지', name: '로그인', location: '/login', url: '/login', done: false },
  { category: '공통', name: 'AppHeader', location: 'components/common/', url: '', done: true },
  { category: '공통', name: 'AppSidebar', location: 'components/common/', url: '', done: true },
  { category: 'UI', name: 'UiTextarea', location: 'components/ui/', url: '', done: true },
]

// 섹션 2: 디자인 토큰 — 색상
const colorTokens = [
  { name: 'Primary', value: '#2563eb' },
  { name: 'Primary Hover', value: '#1d4ed8' },
  { name: 'Secondary', value: '#64748b' },
  { name: 'Background', value: '#F4F7F9' },
  { name: 'Surface', value: '#f8fafc' },
  { name: 'Border', value: '#DCE4E9' },
  { name: 'Text Primary', value: '#4D5462' },
  { name: 'Text Secondary', value: '#64748b' },
  { name: 'Text Disabled', value: '#94a3b8' },
  { name: 'Success', value: '#22c55e' },
  { name: 'Error', value: '#ef4444' },
  { name: 'Warning', value: '#f59e0b' },
  { name: 'Info', value: '#3b82f6' },
]

// 타이포그래피
const typoTokens = [
  { name: '$font-size-xs', size: '0.75rem' },
  { name: '$font-size-sm', size: '0.875rem' },
  { name: '$font-size-base', size: '1rem' },
  { name: '$font-size-lg', size: '1.125rem' },
  { name: '$font-size-xl', size: '1.25rem' },
  { name: '$font-size-2xl', size: '1.5rem' },
]

// 간격
const spacingTokens = [
  { name: '$spacing-xs', value: '4px' },
  { name: '$spacing-sm', value: '8px' },
  { name: '$spacing-md', value: '16px' },
  { name: '$spacing-lg', value: '24px' },
  { name: '$spacing-xl', value: '32px' },
  { name: '$spacing-2xl', value: '48px' },
]

// 둥글기
const radiusTokens = [
  { name: '$border-radius-sm', value: '6px' },
  { name: '$border-radius-md', value: '8px' },
  { name: '$border-radius-lg', value: '12px' },
  { name: '$border-radius-full', value: '9999px' },
]

// 그림자
const shadowTokens = [
  { name: '$shadow-sm', value: '0 1px 2px rgba(0,0,0,0.05)' },
  { name: '$shadow-md', value: '0 4px 12px rgba(0,0,0,0.08)' },
  { name: '$shadow-lg', value: '0 8px 30px rgba(0,0,0,0.12)' },
]

// 섹션 3: UI 컴포넌트 카드 목록
const componentList = [
  {
    name: 'UiTextarea',
    to: '/guide/ui-textarea',
    description: 'v-model 지원, autoResize, maxRows 제한 등',
    tags: ['v-model', 'autoResize', 'disabled'],
  },
]

// 섹션 4: 아이콘 목록
const iconList = [
  { class: 'icon-menu' },
  { class: 'icon-ai-chat' },
  { class: 'icon-chart' },
  { class: 'icon-system' },
  { class: 'icon-group' },
  { class: 'icon-settings' },
  { class: 'icon-knowledge' },
  { class: 'icon-database' },
  { class: 'icon-sparkle' },
  { class: 'icon-send' },
  { class: 'icon-notification' },
  { class: 'icon-user' },
]
</script>
