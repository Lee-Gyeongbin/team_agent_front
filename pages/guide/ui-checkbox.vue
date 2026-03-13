<template>
  <div class="guide-page">
    <NuxtLink to="/guide" class="guide-back">← 가이드 목록</NuxtLink>
    <h1 class="guide-title">UiCheckbox</h1>
    <p class="guide-description">v-model 지원 체크박스 — label, disabled 지원</p>

    <!-- 기본 사용 -->
    <section class="guide-section">
      <h2 class="section-title">기본 사용</h2>
      <div class="guide-demo">
        <p class="demo-label">v-model: {{ checked }}</p>
        <div class="demo-box">
          <UiCheckbox v-model="checked" label="동의합니다" />
        </div>
        <pre class="demo-code">&lt;UiCheckbox v-model="checked" label="동의합니다" /&gt;</pre>
      </div>
    </section>

    <!-- 여러 개 -->
    <section class="guide-section">
      <h2 class="section-title">여러 개 체크박스</h2>
      <div class="guide-demo">
        <p class="demo-label">스트리밍: {{ streaming }}, 함수호출: {{ functionCall }}, 비전: {{ vision }}</p>
        <div class="demo-box">
          <div style="display: flex; gap: 16px;">
            <UiCheckbox v-model="streaming" label="스트리밍" />
            <UiCheckbox v-model="functionCall" label="함수 호출 (Tool)" />
            <UiCheckbox v-model="vision" label="비전(이미지)" />
          </div>
        </div>
        <pre class="demo-code">
&lt;UiCheckbox v-model="streaming" label="스트리밍" /&gt;
&lt;UiCheckbox v-model="functionCall" label="함수 호출 (Tool)" /&gt;
&lt;UiCheckbox v-model="vision" label="비전(이미지)" /&gt;</pre>
      </div>
    </section>

    <!-- 슬롯 사용 -->
    <section class="guide-section">
      <h2 class="section-title">슬롯 사용</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiCheckbox v-model="slotCheck">
            <span style="font-weight: 600;">커스텀 라벨</span>
            <span style="color: #94a3b8; margin-left: 4px;">(슬롯)</span>
          </UiCheckbox>
        </div>
        <pre class="demo-code">
&lt;UiCheckbox v-model="value"&gt;
  &lt;span&gt;커스텀 라벨&lt;/span&gt;
&lt;/UiCheckbox&gt;</pre>
      </div>
    </section>

    <!-- disabled -->
    <section class="guide-section">
      <h2 class="section-title">Disabled</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="display: flex; gap: 16px;">
            <UiCheckbox :model-value="false" label="비활성 (미체크)" disabled />
            <UiCheckbox :model-value="true" label="비활성 (체크됨)" disabled />
          </div>
        </div>
        <pre class="demo-code">
&lt;UiCheckbox :model-value="false" label="비활성 (미체크)" disabled /&gt;
&lt;UiCheckbox :model-value="true" label="비활성 (체크됨)" disabled /&gt;</pre>
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
          <tr>
            <td>label</td>
            <td>string</td>
            <td>''</td>
            <td>체크박스 라벨 텍스트</td>
          </tr>
          <tr>
            <td>disabled</td>
            <td>boolean</td>
            <td>false</td>
            <td>비활성화</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
const checked = ref(false)
const streaming = ref(true)
const functionCall = ref(true)
const vision = ref(false)
const slotCheck = ref(false)
</script>
