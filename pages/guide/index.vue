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
            <td :class="`status-${item.status}`">
              {{ item.status === 'done' ? '✅ 완료' : item.status === 'wip' ? '🔨 작업중' : '⬜ 미완' }}
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

      <div class="guide-demo">
        <p class="demo-label">등록된 아이콘</p>
        <div class="demo-box">
          <div
            v-for="group in iconGroups"
            :key="group.title"
            class="icon-group-section"
          >
            <h4 class="icon-group-title">{{ group.title }}</h4>
            <div class="guide-icon-grid">
              <div
                v-for="icon in group.icons"
                :key="icon.class"
                class="icon-item"
              >
                <i :class="[icon.class, 'size-24']" />
                <span class="icon-name">.{{ icon.class }}</span>
              </div>
            </div>
          </div>
        </div>
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
  { category: '페이지', name: '채팅 메인', location: '/chat', url: '/chat', status: 'done' },
  { category: '페이지', name: '채팅 상세', location: '/chat/:id', url: '', status: 'wip' },
  { category: '페이지', name: '라이브러리', location: '/library', url: '/library', status: 'wip' },
  { category: '페이지', name: '에이전트 목록', location: '/agents', url: '/agents', status: 'pending' },
  { category: '페이지', name: '에이전트 생성', location: '/agents/new', url: '/agents/new', status: 'pending' },
  { category: '페이지', name: '에이전트 상세', location: '/agents/:id', url: '', status: 'pending' },
  { category: '페이지', name: '엑셀 뷰어', location: '/excel', url: '/excel', status: 'done' },
  { category: 'UI 컴포넌트', name: 'UiInput', location: '/guide/ui-input', url: '/guide/ui-input', status: 'done' },
  { category: 'UI 컴포넌트', name: 'UiTable', location: '/guide/ui-table', url: '/guide/ui-table', status: 'done' },
  { category: '페이지', name: '로그인', location: '/login', url: '/login', status: 'pending' },
]

// 섹션 2: 디자인 토큰 — 색상 (_variables.scss 기준)
const colorTokens = [
  { name: '$color-primary', value: '#3c69db' },
  { name: '$color-primary-hover', value: '#1d4ed8' },
  { name: '$color-primary-dark', value: '#2b43a2' },
  { name: '$color-primary-dark-hover', value: '#1d3589' },
  { name: '$color-secondary', value: '#64748b' },
  { name: '$color-background', value: '#f4f7f9' },
  { name: '$color-surface', value: '#f8fafc' },
  { name: '$color-border', value: '#dce4e9' },
  { name: '$color-text-dark', value: '#2d3139' },
  { name: '$color-text-primary', value: '#4d5462' },
  { name: '$color-text-secondary', value: '#64748b' },
  { name: '$color-text-disabled', value: '#94a3b8' },
  { name: '$color-success', value: '#22c55e' },
  { name: '$color-error', value: '#ef4444' },
  { name: '$color-warning', value: '#f59e0b' },
  { name: '$color-info', value: '#3b82f6' },
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

// 둥글기 (_variables.scss 기준)
const radiusTokens = [
  { name: '$border-radius-sm', value: '4px' },
  { name: '$border-radius-base', value: '6px' },
  { name: '$border-radius-lg', value: '8px' },
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
  {
    name: 'UiSelect',
    to: '/guide/ui-select',
    description: 'v-model 지원 네이티브 Select — size 3단계 (sm/md/lg)',
    tags: ['v-model', 'size', 'placeholder', 'disabled'],
  },
  {
    name: 'UiButton',
    to: '/guide/ui-button',
    description: 'variant / size / icon / iconOnly 지원 버튼 컴포넌트',
    tags: ['variant', 'size', 'icon-left', 'icon-right', 'iconOnly'],
  },
  {
    name: 'UiBadge',
    to: '/guide/ui-badge',
    description: 'variant 4종 / icon-left / icon-right / iconOnly 지원 배지 컴포넌트',
    tags: ['variant', 'icon-left', 'icon-right', 'iconOnly'],
  },
  {
    name: 'UiChart',
    to: '/guide/ui-chart',
    description: 'Chart.js 기반 차트 — bar, line, pie, mixed, horizontalBar 5종',
    tags: ['type', 'config', 'showLegend'],
  },
  {
    name: 'UiInput',
    to: '/guide/ui-input',
    description: 'v-model 지원 텍스트 입력 — size, 검색 타입, 아이콘 슬롯',
    tags: ['v-model', 'type', 'size', 'icon-left', 'icon-right'],
  },
  {
    name: 'UiTable',
    to: '/guide/ui-table',
    description: '컬럼 정의 기반 데이터 테이블 — 정렬, 고정 헤더, 셀 커스터마이징',
    tags: ['columns', 'data', 'stickyHeader', 'slot'],
  },
]

// 섹션 4: 아이콘 목록 (그룹별로 구분)
const iconGroups = [
  {
    title: '사이드바 아이콘',
    icons: [
      { class: 'icon-menu' },
      { class: 'icon-ai-chat' },
      { class: 'icon-chart' },
      { class: 'icon-system' },
      { class: 'icon-group' },
      { class: 'icon-settings' },
      { class: 'icon-knowledge' },
      { class: 'icon-database' },
    ],
  },
  {
    title: 'chat 아이콘',
    icons: [{ class: 'icon-sparkle' }, { class: 'icon-send' }],
  },
  {
    title: '채팅 아이콘',
    icons: [
      { class: 'icon-bot' },
      { class: 'icon-copy' },
      { class: 'icon-thumbs-up' },
      { class: 'icon-thumbs-down' },
      { class: 'icon-refresh' },
      { class: 'icon-more' },
    ],
  },
  {
    title: '헤더 아이콘',
    icons: [{ class: 'icon-notification' }, { class: 'icon-user' }],
  },
  {
    title: 'library 아이콘',
    icons: [
      { class: 'icon-search' },
      { class: 'icon-archive' },
      { class: 'icon-delete' },
      { class: 'icon-delete-bg' },
      { class: 'icon-add-dot' },
      { class: 'icon-diamond' },
      { class: 'icon-heart' },
      { class: 'icon-plus' },
      { class: 'icon-logout' },
    ],
  },
  {
    title: '드롭다운 아이콘',
    icons: [
      { class: 'icon-edit' },
      { class: 'icon-trashcan' },
      { class: 'icon-view' },
      { class: 'icon-transfer' },
      { class: 'icon-star-line' },
      { class: 'icon-star-fill' },
      { class: 'icon-copy-gray' },
    ],
  },
  {
    title: '관련자료 패널 아이콘',
    icons: [
      { class: 'icon-expand' },
      { class: 'icon-collapse' },
      { class: 'icon-close' },
      { class: 'icon-arrow-right' },
      { class: 'icon-close-gray' },
    ],
  },
  {
    title: '공통',
    icons: [{ class: 'icon-arrow-down' }],
  },
  {
    title: '시각화 패널 아이콘',
    icons: [
      { class: 'icon-file-ai' },
      { class: 'icon-bar-chart' },
      { class: 'icon-line-chart' },
      { class: 'icon-pie-chart' },
      { class: 'icon-chevron-down' },
    ],
  },
  {
    title: '뱃지 아이콘',
    icons: [
      { class: 'icon-data-line-small' },
      { class: 'icon-comment-other' },
      { class: 'icon-book' },
      { class: 'icon-diamond-small' },
    ],
  },
]
</script>
