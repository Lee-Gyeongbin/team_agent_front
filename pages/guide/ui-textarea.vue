<template>
  <div class="guide-page">
    <NuxtLink
      to="/guide"
      class="guide-back"
      >← 가이드 목록</NuxtLink
    >
    <h1 class="guide-title">UiTextarea</h1>
    <p class="guide-description">v-model 지원 Textarea 컴포넌트 — autoResize, maxRows, disabled</p>

    <!-- 기본 -->
    <section class="guide-section">
      <h2 class="section-title">기본 (rows=3)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiTextarea
            v-model="textareaDefault"
            placeholder="기본 Textarea"
            :rows="3"
          />
        </div>
        <pre class="demo-code">&lt;UiTextarea v-model="value" placeholder="기본 Textarea" :rows="3" /&gt;</pre>
      </div>
    </section>

    <!-- autoResize -->
    <section class="guide-section">
      <h2 class="section-title">autoResize</h2>
      <p class="guide-demo-desc">입력에 따라 높이가 자동으로 확장됩니다.</p>
      <div class="guide-demo">
        <div class="demo-box">
          <UiTextarea
            v-model="textareaAuto"
            placeholder="입력하면 자동으로 늘어납니다"
            :auto-resize="true"
          />
        </div>
        <pre class="demo-code">&lt;UiTextarea v-model="value" placeholder="..." :auto-resize="true" /&gt;</pre>
      </div>
    </section>

    <!-- maxRows -->
    <section class="guide-section">
      <h2 class="section-title">autoResize + maxRows=4</h2>
      <p class="guide-demo-desc">최대 4줄까지만 확장되고 이후 스크롤됩니다.</p>
      <div class="guide-demo">
        <div class="demo-box">
          <UiTextarea
            v-model="textareaMaxRows"
            placeholder="최대 4줄까지 확장됩니다"
            :auto-resize="true"
            :max-rows="4"
          />
        </div>
        <pre class="demo-code">&lt;UiTextarea v-model="value" :auto-resize="true" :max-rows="4" /&gt;</pre>
      </div>
    </section>

    <!-- disabled -->
    <section class="guide-section">
      <h2 class="section-title">disabled</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiTextarea
            model-value="비활성 상태 텍스트"
            placeholder="비활성"
            :disabled="true"
            :rows="2"
          />
        </div>
        <pre class="demo-code">&lt;UiTextarea model-value="비활성 상태" :disabled="true" :rows="2" /&gt;</pre>
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
  </div>
</template>

<script setup lang="ts">
const textareaDefault = ref('')
const textareaAuto = ref('')
const textareaMaxRows = ref('')

const propList = [
  { name: 'modelValue', type: 'string', default: "''", desc: 'v-model 바인딩 값' },
  { name: 'placeholder', type: 'string', default: "''", desc: '플레이스홀더 텍스트' },
  { name: 'disabled', type: 'boolean', default: 'false', desc: '비활성 상태' },
  { name: 'rows', type: 'number', default: '1', desc: '기본 줄 수' },
  { name: 'autoResize', type: 'boolean', default: 'false', desc: '입력에 따라 높이 자동 조절' },
  { name: 'maxRows', type: 'number', default: 'undefined', desc: 'autoResize 시 최대 줄 수 제한' },
]
</script>
