<template>
  <div class="guide-page">
    <NuxtLink
      to="/guide"
      class="guide-back"
    >
      ← 가이드 목록
    </NuxtLink>
    <h1 class="guide-title">UiBadge</h1>
    <p class="guide-description">variant 4종 / icon-left / icon-right / iconOnly 지원 배지 컴포넌트</p>

    <!-- variant -->
    <section class="guide-section">
      <h2 class="section-title">Variant</h2>
      <div class="guide-demo">
        <div
          class="demo-box"
          style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap"
        >
          <UiBadge variant="data-line">데이터분석</UiBadge>
          <UiBadge variant="basic-chat">기본대화</UiBadge>
          <UiBadge variant="manual-ai">매뉴얼AI</UiBadge>
          <UiBadge variant="default">기본</UiBadge>
        </div>
        <pre class="demo-code">&lt;UiBadge variant="data-line"&gt;데이터분석&lt;/UiBadge&gt;
&lt;UiBadge variant="basic-chat"&gt;기본대화&lt;/UiBadge&gt;
&lt;UiBadge variant="manual-ai"&gt;매뉴얼AI&lt;/UiBadge&gt;
&lt;UiBadge variant="default"&gt;기본&lt;/UiBadge&gt;</pre>
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
          <UiBadge
            variant="data-line"
            size="xs"
          >
            Extra Small
          </UiBadge>
          <UiBadge
            variant="data-line"
            size="sm"
          >
            Small
          </UiBadge>
          <UiBadge
            variant="data-line"
            size="md"
          >
            Medium
          </UiBadge>
          <UiBadge
            variant="data-line"
            size="lg"
          >
            Large
          </UiBadge>
        </div>
        <pre class="demo-code">&lt;UiBadge variant="data-line" size="xs"&gt;Extra Small&lt;/UiBadge&gt;
&lt;UiBadge variant="data-line" size="sm"&gt;Small&lt;/UiBadge&gt;
&lt;UiBadge variant="data-line" size="md"&gt;Medium&lt;/UiBadge&gt;
&lt;UiBadge variant="data-line" size="lg"&gt;Large&lt;/UiBadge&gt;</pre>
      </div>
    </section>

    <!-- icon left -->
    <section class="guide-section">
      <h2 class="section-title">왼쪽 아이콘</h2>
      <div class="guide-demo">
        <div
          class="demo-box"
          style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap"
        >
          <UiBadge variant="data-line">
            <template #icon-left>
              <i class="icon icon-data-line-small size-14"></i>
            </template>
            데이터분석
          </UiBadge>
          <UiBadge variant="basic-chat">
            <template #icon-left>
              <i class="icon icon-comment-other size-14"></i>
            </template>
            기본대화
          </UiBadge>
          <UiBadge variant="manual-ai">
            <template #icon-left>
              <i class="icon icon-book size-14"></i>
            </template>
            매뉴얼AI
          </UiBadge>
        </div>
        <pre class="demo-code">&lt;UiBadge variant="data-line"&gt;
  &lt;template #icon-left&gt;
    &lt;i class="icon icon-data-line-small size-14"&gt;&lt;/i&gt;
  &lt;/template&gt;
  데이터분석
&lt;/UiBadge&gt;</pre>
      </div>
    </section>

    <!-- icon right -->
    <section class="guide-section">
      <h2 class="section-title">오른쪽 아이콘</h2>
      <div class="guide-demo">
        <div
          class="demo-box"
          style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap"
        >
          <UiBadge variant="default">
            카테고리
            <template #icon-right>
              <i class="icon icon-arrow-down size-12"></i>
            </template>
          </UiBadge>
        </div>
        <pre class="demo-code">&lt;UiBadge variant="default"&gt;
  카테고리
  &lt;template #icon-right&gt;
    &lt;i class="icon icon-arrow-down size-12"&gt;&lt;/i&gt;
  &lt;/template&gt;
&lt;/UiBadge&gt;</pre>
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
          <UiBadge
            variant="data-line"
            icon-only
          >
            <template #icon-left>
              <i class="icon icon-data-line-small size-14"></i>
            </template>
          </UiBadge>
          <UiBadge
            variant="basic-chat"
            icon-only
          >
            <template #icon-left>
              <i class="icon icon-comment-other size-14"></i>
            </template>
          </UiBadge>
          <UiBadge
            variant="manual-ai"
            icon-only
          >
            <template #icon-left>
              <i class="icon icon-book size-14"></i>
            </template>
          </UiBadge>
          <UiBadge
            variant="default"
            icon-only
          >
            <template #icon-left>
              <i class="icon icon-diamond-small size-10"></i>
            </template>
          </UiBadge>
        </div>
        <pre class="demo-code">&lt;UiBadge variant="data-line" icon-only&gt;
  &lt;template #icon-left&gt;
    &lt;i class="icon icon-data-line-small size-14"&gt;&lt;/i&gt;
  &lt;/template&gt;
&lt;/UiBadge&gt;</pre>
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
            <td><code>{{ prop.name }}</code></td>
            <td>{{ prop.type }}</td>
            <td><code>{{ prop.default }}</code></td>
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
            <td><code>{{ slot.name }}</code></td>
            <td>{{ slot.desc }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
const propList = [
  { name: 'variant', type: "'data-line' | 'basic-chat' | 'manual-ai' | 'default'", default: "'default'", desc: '배지 스타일 (색상 조합)' },
  { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'sm'", desc: '배지 크기 (20 / 22 / 24 / 26px)' },
  { name: 'iconOnly', type: 'boolean', default: 'false', desc: '아이콘만 표시 (정사각형)' },
]

const slotList = [
  { name: 'default', desc: '배지 텍스트' },
  { name: 'icon-left', desc: '왼쪽 아이콘' },
  { name: 'icon-right', desc: '오른쪽 아이콘' },
]
</script>
