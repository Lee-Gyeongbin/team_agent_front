<template>
  <div class="guide-page">
    <NuxtLink
      to="/guide"
      class="guide-back"
      >← 가이드 목록</NuxtLink
    >
    <h1 class="guide-title">UiMultiSelect</h1>
    <p class="guide-description">
      Radix-vue Popover 기반 멀티 선택 — 체크 UI, v-model은 값 배열, 트리거 라벨 축약(maxLabels) 지원
    </p>

    <!-- 기본 (md) -->
    <section class="guide-section">
      <h2 class="section-title">기본 (size=md)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div class="w-200">
            <UiMultiSelect
              v-model="selectedDefault"
              :options="fruitOptions"
              placeholder="과일을 선택하세요"
            />
          </div>
          <p class="demo-result">선택값: {{ selectedDefault.length ? JSON.stringify(selectedDefault) : '(없음)' }}</p>
        </div>
        <pre class="demo-code">&lt;UiMultiSelect v-model="values" :options="options" placeholder="과일을 선택하세요" /&gt;</pre>
      </div>
    </section>

    <!-- 사이즈 비교 -->
    <section class="guide-section">
      <h2 class="section-title">사이즈 비교</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap">
            <div>
              <p class="demo-label">xs</p>
              <UiMultiSelect
                v-model="selectedXs"
                :options="fruitOptions"
                size="xs"
                placeholder="xs"
              />
            </div>
            <div>
              <p class="demo-label">sm</p>
              <UiMultiSelect
                v-model="selectedSm"
                :options="fruitOptions"
                size="sm"
                placeholder="sm"
              />
            </div>
            <div class="w-150">
              <p class="demo-label">md (기본)</p>
              <UiMultiSelect
                v-model="selectedMd"
                :options="fruitOptions"
                size="md"
                placeholder="md"
              />
            </div>
            <div class="w-150">
              <p class="demo-label">lg</p>
              <UiMultiSelect
                v-model="selectedLg"
                :options="fruitOptions"
                size="lg"
                placeholder="lg"
              />
            </div>
            <div class="w-150">
              <p class="demo-label">xlg</p>
              <UiMultiSelect
                v-model="selectedXlg"
                :options="fruitOptions"
                size="xlg"
                placeholder="xlg"
              />
            </div>
          </div>
        </div>
        <pre class="demo-code">
&lt;UiMultiSelect :options="opts" size="xs" v-model="v" /&gt;
&lt;UiMultiSelect :options="opts" size="sm" v-model="v" /&gt;
&lt;UiMultiSelect :options="opts" size="md" v-model="v" /&gt;  &lt;!-- 기본 --&gt;
&lt;UiMultiSelect :options="opts" size="lg" v-model="v" /&gt;
&lt;UiMultiSelect :options="opts" size="xlg" v-model="v" /&gt;</pre
        >
      </div>
    </section>

    <!-- disabled -->
    <section class="guide-section">
      <h2 class="section-title">disabled</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div class="w-200">
            <UiMultiSelect
              :model-value="['apple', 'banana']"
              :options="fruitOptions"
              :disabled="true"
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiMultiSelect :model-value="['apple','banana']" :options="options" :disabled="true" /&gt;</pre>
      </div>
    </section>

    <!-- maxLabels -->
    <section class="guide-section">
      <h2 class="section-title">maxLabels (트리거 라벨 축약)</h2>
      <p class="guide-demo-desc">
        선택 개수가 <code>maxLabels</code>를 넘으면 첫 라벨 + 「외 N건」으로 줄입니다. 기본값은 2입니다 (3개 이상 선택 시 축약).
      </p>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="display: flex; flex-direction: column; gap: 16px; max-width: 320px">
            <div>
              <p class="demo-label">maxLabels=2 (기본) — 3개 이상 선택 시 축약</p>
              <UiMultiSelect
                v-model="selectedCollapseDefault"
                :options="fruitOptions"
                placeholder="선택"
              />
            </div>
            <div>
              <p class="demo-label">maxLabels=3 — 네 개부터 축약</p>
              <UiMultiSelect
                v-model="selectedCollapseWide"
                :options="fruitOptions"
                :max-labels="3"
                placeholder="선택"
              />
            </div>
          </div>
        </div>
        <pre class="demo-code">&lt;UiMultiSelect v-model="v" :options="opts" /&gt;
&lt;UiMultiSelect v-model="v" :options="opts" :max-labels="3" /&gt;</pre>
      </div>
    </section>

    <!-- radius -->
    <section class="guide-section">
      <h2 class="section-title">radius</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap">
            <div class="w-150">
              <p class="demo-label">sm</p>
              <UiMultiSelect
                v-model="selectedRadiusSm"
                :options="fruitOptions"
                radius="sm"
                placeholder="sm"
              />
            </div>
            <div class="w-150">
              <p class="demo-label">base (기본)</p>
              <UiMultiSelect
                v-model="selectedRadiusBase"
                :options="fruitOptions"
                radius="base"
                placeholder="base"
              />
            </div>
            <div class="w-150">
              <p class="demo-label">lg</p>
              <UiMultiSelect
                v-model="selectedRadiusLg"
                :options="fruitOptions"
                radius="lg"
                placeholder="lg"
              />
            </div>
          </div>
        </div>
        <pre class="demo-code">&lt;UiMultiSelect radius="sm" /&gt;
&lt;UiMultiSelect radius="base" /&gt;
&lt;UiMultiSelect radius="lg" /&gt;</pre>
      </div>
    </section>

    <!-- hover / 선택 상태 -->
    <section class="guide-section">
      <h2 class="section-title">목록 hover / 선택 상태</h2>
      <p class="guide-demo-desc">항목에 마우스를 올리면 배경 강조, 선택된 항목은 체크박스·라벨이 primary 색으로 표시됩니다.</p>
      <div class="guide-demo">
        <div class="demo-box">
          <div class="w-200">
            <UiMultiSelect
              v-model="selectedStates"
              :options="fruitOptions"
              placeholder="열어서 확인"
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiMultiSelect v-model="values" :options="options" /&gt;</pre>
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
// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const fruitOptions = [
  { label: '사과', value: 'apple' },
  { label: '바나나', value: 'banana' },
  { label: '포도', value: 'grape' },
  { label: '딸기', value: 'strawberry' },
]

const selectedDefault = ref<Array<string | number>>([])
const selectedXs = ref<Array<string | number>>([])
const selectedSm = ref<Array<string | number>>([])
const selectedMd = ref<Array<string | number>>([])
const selectedLg = ref<Array<string | number>>([])
const selectedXlg = ref<Array<string | number>>([])
const selectedCollapseDefault = ref<Array<string | number>>(['apple', 'banana', 'grape'])
const selectedCollapseWide = ref<Array<string | number>>(['apple', 'banana', 'grape'])
const selectedRadiusSm = ref<Array<string | number>>([])
const selectedRadiusBase = ref<Array<string | number>>([])
const selectedRadiusLg = ref<Array<string | number>>([])
const selectedStates = ref<Array<string | number>>(['strawberry'])

const propList = [
  {
    name: 'modelValue',
    type: 'Array<string | number>',
    default: '[]',
    desc: 'v-model — 선택된 value 목록',
  },
  {
    name: 'options',
    type: 'MultiSelectOption[]',
    default: '필수',
    desc: '옵션 목록 ({ label, value }) — value는 string | number',
  },
  {
    name: 'placeholder',
    type: 'string',
    default: "'' → 표시는 '선택'",
    desc: '미선택 시 트리거에 보이는 안내 문구 (빈 문자열이면 내부 기본 문구)',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    desc: '비활성',
  },
  {
    name: 'name',
    type: 'string',
    default: 'undefined',
    desc: 'form name (미사용 시 생략)',
  },
  {
    name: 'id',
    type: 'string',
    default: 'undefined',
    desc: 'id 속성 (미사용 시 생략)',
  },
  {
    name: 'size',
    type: "'xs' | 'sm' | 'md' | 'lg' | 'xlg'",
    default: "'md'",
    desc: '트리거 높이·폰트 사이즈',
  },
  {
    name: 'radius',
    type: "'sm' | 'base' | 'lg'",
    default: "'base'",
    desc: '트리거 테두리 둥글기',
  },
  {
    name: 'maxLabels',
    type: 'number',
    default: '2',
    desc: '이 개수 이하일 때만 트리거에 라벨을 콤마로 모두 표시, 초과 시 「첫 라벨 외 N건」',
  },
]
</script>
