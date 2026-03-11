<template>
  <div class="guide-page">
    <NuxtLink
      to="/guide"
      class="guide-back"
    >
      ← 가이드 목록
    </NuxtLink>
    <h1 class="guide-title">UiButton</h1>
    <p class="guide-description">variant / size / icon / iconOnly 지원 버튼 컴포넌트</p>

    <!-- variant -->
    <section class="guide-section">
      <h2 class="section-title">Variant</h2>
      <div class="guide-demo">
        <div
          class="demo-box"
          style="display: flex; gap: 12px; align-items: center"
        >
          <UiButton variant="primary">Primary</UiButton>
          <UiButton variant="secondary">Secondary</UiButton>
          <UiButton variant="outline">Outline</UiButton>
          <UiButton variant="ghost">Ghost</UiButton>
        </div>
        <pre class="demo-code">
&lt;UiButton variant="primary"&gt;Primary&lt;/UiButton&gt;
&lt;UiButton variant="secondary"&gt;Secondary&lt;/UiButton&gt;
&lt;UiButton variant="outline"&gt;Outline&lt;/UiButton&gt;
&lt;UiButton variant="ghost"&gt;Ghost&lt;/UiButton&gt;</pre
        >
      </div>
    </section>

    <!-- size -->
    <section class="guide-section">
      <h2 class="section-title">Size</h2>
      <div class="guide-demo">
        <div
          class="demo-box"
          style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap"
        >
          <UiButton size="xxs">Extra Extra Small</UiButton>
          <UiButton size="xs">Extra Small</UiButton>
          <UiButton size="sm">Small</UiButton>
          <UiButton size="md">Medium</UiButton>
          <UiButton size="lg">Large</UiButton>
        </div>
        <pre class="demo-code">
&lt;UiButton size="xxs"&gt;Extra Extra Small&lt;/UiButton&gt;
&lt;UiButton size="xs"&gt;Extra Small&lt;/UiButton&gt;
&lt;UiButton size="sm"&gt;Small&lt;/UiButton&gt;
&lt;UiButton size="md"&gt;Medium&lt;/UiButton&gt;
&lt;UiButton size="lg"&gt;Large&lt;/UiButton&gt;</pre
        >
      </div>
    </section>

    <!-- icon left -->
    <section class="guide-section">
      <h2 class="section-title">왼쪽 아이콘</h2>
      <div class="guide-demo">
        <div
          class="demo-box"
          style="display: flex; gap: 12px; align-items: center"
        >
          <UiButton variant="outline">
            <template #icon-left>
              <i class="icon-copy size-16" />
            </template>
            복사
          </UiButton>
          <UiButton variant="secondary">
            <template #icon-left>
              <i class="icon-refresh size-16" />
            </template>
            새로고침
          </UiButton>
        </div>
        <pre class="demo-code">
&lt;UiButton variant="outline"&gt;
  &lt;template #icon-left&gt;&lt;i class="icon-copy size-16" /&gt;&lt;/template&gt;
  복사
&lt;/UiButton&gt;</pre
        >
      </div>
    </section>

    <!-- icon right -->
    <section class="guide-section">
      <h2 class="section-title">오른쪽 아이콘</h2>
      <div class="guide-demo">
        <div
          class="demo-box"
          style="display: flex; gap: 12px; align-items: center"
        >
          <UiButton variant="primary">
            원문보기
            <template #icon-right>
              <i class="icon-expand size-16" />
            </template>
          </UiButton>
        </div>
        <pre class="demo-code">
&lt;UiButton variant="primary"&gt;
  원문보기
  &lt;template #icon-right&gt;&lt;i class="icon-expand size-16" /&gt;&lt;/template&gt;
&lt;/UiButton&gt;</pre
        >
      </div>
    </section>

    <!-- icon only -->
    <section class="guide-section">
      <h2 class="section-title">아이콘 온리</h2>
      <div class="guide-demo">
        <div
          class="demo-box"
          style="display: flex; gap: 12px; align-items: center"
        >
          <UiButton
            variant="ghost"
            icon-only
            size="xs"
          >
            <template #icon-left>
              <i class="icon-close size-16" />
            </template>
          </UiButton>
          <UiButton
            variant="outline"
            icon-only
          >
            <template #icon-left>
              <i class="icon-expand size-16" />
            </template>
          </UiButton>
          <UiButton
            variant="secondary"
            icon-only
            size="lg"
          >
            <template #icon-left>
              <i class="icon-settings size-20" />
            </template>
          </UiButton>
        </div>
        <pre class="demo-code">
&lt;UiButton variant="ghost" icon-only size="xs"&gt;
  &lt;template #icon-left&gt;&lt;i class="icon-close size-16" /&gt;&lt;/template&gt;
&lt;/UiButton&gt;</pre
        >
      </div>
    </section>

    <!-- disabled -->
    <section class="guide-section">
      <h2 class="section-title">Disabled</h2>
      <div class="guide-demo">
        <div
          class="demo-box"
          style="display: flex; gap: 12px; align-items: center"
        >
          <UiButton
            variant="primary"
            disabled
          >
            Primary
          </UiButton>
          <UiButton
            variant="outline"
            disabled
          >
            Outline
          </UiButton>
        </div>
      </div>
    </section>

    <!-- fullWidth -->
    <section class="guide-section">
      <h2 class="section-title">Full Width</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiButton
            variant="primary"
            full-width
          >
            전체 너비 버튼
          </UiButton>
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
          <tr
            v-for="prop in propList"
            :key="prop.name"
          >
            <td>
              <code>{{ prop.name }}</code>
            </td>
            <td>{{ prop.type }}</td>
            <td>
              <code>{{ prop.default }}</code>
            </td>
            <td>{{ prop.desc }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Slots -->
    <section class="guide-section">
      <h2 class="section-title">Slots</h2>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>Slot</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="slot in slotList"
            :key="slot.name"
          >
            <td>
              <code>{{ slot.name }}</code>
            </td>
            <td>{{ slot.desc }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
const propList = [
  { name: 'variant', type: "'primary' | 'secondary' | 'outline' | 'ghost'", default: "'primary'", desc: '버튼 스타일' },
  {
    name: 'size',
    type: "'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xlg'",
    default: "'md'",
    desc: '버튼 크기 (24 / 26 / 28 / 30 / 32 / 36px)',
  },
  { name: 'disabled', type: 'boolean', default: 'false', desc: '비활성 상태' },
  { name: 'loading', type: 'boolean', default: 'false', desc: '로딩 상태' },
  { name: 'fullWidth', type: 'boolean', default: 'false', desc: '전체 너비' },
  { name: 'iconOnly', type: 'boolean', default: 'false', desc: '아이콘만 표시 (정사각형)' },
]

const slotList = [
  { name: 'default', desc: '버튼 텍스트' },
  { name: 'icon-left', desc: '왼쪽 아이콘' },
  { name: 'icon-right', desc: '오른쪽 아이콘' },
]
</script>
