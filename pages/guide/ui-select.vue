<template>
  <div class="guide-page">
    <NuxtLink
      to="/guide"
      class="guide-back"
      >← 가이드 목록</NuxtLink
    >
    <h1 class="guide-title">UiSelect</h1>
    <p class="guide-description">Radix-vue 기반 커스텀 Select — hover/active 스타일, 키보드 접근성 지원</p>

    <!-- 기본 (md) -->
    <section class="guide-section">
      <h2 class="section-title">기본 (size=md)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div class="w-200">
            <UiSelect
              v-model="selectedDefault"
              :options="fruitOptions"
              placeholder="선택하세요"
            />
          </div>
          <p class="demo-result">선택값: {{ selectedDefault || '(없음)' }}</p>
        </div>
        <pre class="demo-code">&lt;UiSelect v-model="value" :options="options" placeholder="선택하세요" /&gt;</pre>
      </div>
    </section>

    <!-- 사이즈 비교 -->
    <section class="guide-section">
      <h2 class="section-title">사이즈 비교</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="display: flex; align-items: center; gap: 16px">
            <div class="w-150">
              <p class="demo-label">sm (28px)</p>
              <UiSelect
                v-model="selectedSm"
                :options="fruitOptions"
                size="sm"
                placeholder="sm"
              />
            </div>
            <div class="w-150">
              <p class="demo-label">md (32px)</p>
              <UiSelect
                v-model="selectedMd"
                :options="fruitOptions"
                size="md"
                placeholder="md"
              />
            </div>
            <div class="w-150">
              <p class="demo-label">lg (36px)</p>
              <UiSelect
                v-model="selectedLg"
                :options="fruitOptions"
                size="lg"
                placeholder="lg"
              />
            </div>
          </div>
        </div>
        <pre class="demo-code">&lt;UiSelect :options="opts" size="sm" /&gt;
&lt;UiSelect :options="opts" size="md" /&gt;  &lt;!-- 기본 --&gt;
&lt;UiSelect :options="opts" size="lg" /&gt;</pre>
      </div>
    </section>

    <!-- disabled -->
    <section class="guide-section">
      <h2 class="section-title">disabled</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div class="w-200">
            <UiSelect
              model-value="apple"
              :options="fruitOptions"
              :disabled="true"
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiSelect model-value="apple" :options="options" :disabled="true" /&gt;</pre>
      </div>
    </section>

    <!-- hover / active -->
    <section class="guide-section">
      <h2 class="section-title">hover / active 상태</h2>
      <p class="guide-demo-desc">드롭다운 열면 hover 시 배경색, 선택된 항목은 파란색 강조 표시됩니다.</p>
      <div class="guide-demo">
        <div class="demo-box">
          <div class="w-200">
            <UiSelect
              v-model="selectedHover"
              :options="fruitOptions"
              placeholder="클릭해서 확인"
            />
          </div>
        </div>
        <pre class="demo-code">&lt;!-- hover: data-highlighted → 배경색 --&gt;
&lt;!-- active: data-state="checked" → 파란색 + bold --&gt;
&lt;UiSelect v-model="value" :options="options" /&gt;</pre>
      </div>
    </section>

    <!-- 공간 부족 시 위로 -->
    <section class="guide-section">
      <h2 class="section-title">자동 방향 전환</h2>
      <p class="guide-demo-desc">아래 공간이 부족하면 드롭다운이 자동으로 위로 뜹니다. (Radix avoidCollisions)</p>
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
// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const fruitOptions = [
  { label: '사과', value: 'apple' },
  { label: '바나나', value: 'banana' },
  { label: '포도', value: 'grape' },
  { label: '딸기', value: 'strawberry' },
]

const selectedDefault = ref('apple')
const selectedSm = ref('apple')
const selectedMd = ref('apple')
const selectedLg = ref('apple')
const selectedHover = ref('apple')

const propList = [
  { name: 'modelValue', type: 'string | number', default: 'undefined', desc: 'v-model 바인딩 값 (빈 문자열 불가)' },
  { name: 'options', type: 'SelectOption[]', default: '필수', desc: '옵션 목록 ({ label, value })' },
  { name: 'placeholder', type: 'string', default: "'선택'", desc: '미선택 시 안내 텍스트' },
  { name: 'disabled', type: 'boolean', default: 'false', desc: '비활성 상태' },
  { name: 'name', type: 'string', default: 'undefined', desc: 'form name 속성' },
  { name: 'id', type: 'string', default: 'undefined', desc: 'id 속성' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", desc: '높이 사이즈 (28/32/36px)' },
]
</script>
