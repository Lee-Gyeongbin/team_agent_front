<template>
  <div class="guide-page">
    <NuxtLink
      to="/guide"
      class="guide-back"
    >
      ← 가이드 목록
    </NuxtLink>
    <h1 class="guide-title">UiDatePicker</h1>
    <p class="guide-description">Radix-vue DatePicker 기반 날짜/시간 선택 컴포넌트 — 한국어 로케일, 세그먼트 입력, 캘린더 팝업. datetime 모드에서는 날짜(캘린더)와 시간(직접 입력)이 분리되어 표시됩니다.</p>

    <!-- 날짜 선택 -->
    <section class="guide-section">
      <h2 class="section-title">날짜 선택 (type=date)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div class="w-250">
            <UiDatePicker v-model="dateOnly" />
          </div>
          <p class="demo-result">선택값: {{ dateOnly?.toString() || '(없음)' }}</p>
        </div>
        <pre class="demo-code">&lt;UiDatePicker v-model="date" /&gt;</pre>
      </div>
    </section>

    <!-- 날짜+시간 선택 -->
    <section class="guide-section">
      <h2 class="section-title">날짜+시간 선택 (type=datetime)</h2>
      <p class="guide-note">날짜는 캘린더로 선택, 시간은 별도 입력 필드 (클릭 → 숫자 입력 / 화살표 키 ↑↓ 증감)</p>
      <div class="guide-demo">
        <div class="demo-box">
          <div class="w-380">
            <UiDatePicker
              v-model="dateTime"
              type="datetime"
            />
          </div>
          <p class="demo-result">DateValue: {{ dateTime?.toString() || '(없음)' }}</p>
          <p class="demo-result">API 문자열: {{ dateTimeApiStr }}</p>
        </div>
        <pre class="demo-code">&lt;UiDatePicker v-model="dateTime" type="datetime" /&gt;</pre>
      </div>
    </section>

    <!-- 프론트 저장 사용법 -->
    <section class="guide-section">
      <h2 class="section-title">프론트 저장 사용법</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <p class="demo-label">1. API 문자열 → DateValue (조회 시)</p>
          <pre class="demo-code">import { dateValueFromApiString } from '~/utils/global/dateUtil'

const startDt = dateValueFromApiString('2026-03-16 09:30:00')
// → CalendarDateTime { year: 2026, month: 3, day: 16, hour: 9, minute: 30 }</pre>

          <p class="demo-label">2. DateValue → API 문자열 (저장 시)</p>
          <pre class="demo-code">import { apiStringFromDateValue } from '~/utils/global/dateUtil'

const apiStr = apiStringFromDateValue(startDt)
// → '2026-03-16 09:30:00'</pre>

          <p class="demo-label">3. 실제 사용 패턴 (Store에서)</p>
          <pre class="demo-code">// computed로 DatePicker ↔ API 문자열 양방향 바인딩
const startDt = computed({
  get: () => dateValueFromApiString(row.value.startDt),
  set: (v: DateValue | undefined) => {
    row.value.startDt = apiStringFromDateValue(v)
  },
})</pre>
        </div>
      </div>
    </section>

    <!-- 사이즈 비교 -->
    <section class="guide-section">
      <h2 class="section-title">사이즈 비교</h2>
      <div class="guide-demo">
        <div
          class="demo-box"
          style="display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap"
        >
          <div class="w-200">
            <p class="demo-label">xs</p>
            <UiDatePicker
              v-model="sizeXs"
              size="xs"
            />
          </div>
          <div class="w-200">
            <p class="demo-label">sm (기본)</p>
            <UiDatePicker
              v-model="sizeSm"
              size="sm"
            />
          </div>
          <div class="w-200">
            <p class="demo-label">md</p>
            <UiDatePicker
              v-model="sizeMd"
              size="md"
            />
          </div>
          <div class="w-200">
            <p class="demo-label">lg</p>
            <UiDatePicker
              v-model="sizeLg"
              size="lg"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 비활성 -->
    <section class="guide-section">
      <h2 class="section-title">비활성 (disabled)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div class="w-250">
            <UiDatePicker
              v-model="disabledDate"
              disabled
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiDatePicker v-model="date" disabled /&gt;</pre>
      </div>
    </section>

    <!-- 범위 (2개 조합) -->
    <section class="guide-section">
      <h2 class="section-title">기간 선택 (2개 조합)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="display: flex; gap: 12px; align-items: center">
            <div class="w-380">
              <UiDatePicker
                v-model="rangeStart"
                type="datetime"
              />
            </div>
            <span style="color: #94a3b8">~</span>
            <div class="w-380">
              <UiDatePicker
                v-model="rangeEnd"
                type="datetime"
              />
            </div>
          </div>
          <p class="demo-result">
            시작: {{ rangeStart?.toString() || '(없음)' }} / 종료: {{ rangeEnd?.toString() || '(없음)' }}
          </p>
        </div>
      </div>
    </section>

    <!-- Props -->
    <section class="guide-section">
      <h2 class="section-title">Props</h2>
      <table class="guide-table">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>modelValue</td>
            <td>DateValue | undefined</td>
            <td>undefined</td>
            <td>v-model 바인딩 (@internationalized/date)</td>
          </tr>
          <tr>
            <td>type</td>
            <td>'date' | 'datetime'</td>
            <td>'date'</td>
            <td>날짜만 / 날짜+시간</td>
          </tr>
          <tr>
            <td>size</td>
            <td>'xs' | 'sm' | 'md' | 'lg'</td>
            <td>'sm'</td>
            <td>입력 필드 높이</td>
          </tr>
          <tr>
            <td>disabled</td>
            <td>boolean</td>
            <td>false</td>
            <td>비활성화</td>
          </tr>
          <tr>
            <td>locale</td>
            <td>string</td>
            <td>'ko-KR'</td>
            <td>로케일 (요일, 월 표시)</td>
          </tr>
          <tr>
            <td>minValue</td>
            <td>DateValue</td>
            <td>-</td>
            <td>선택 가능 최소 날짜</td>
          </tr>
          <tr>
            <td>maxValue</td>
            <td>DateValue</td>
            <td>-</td>
            <td>선택 가능 최대 날짜</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { apiStringFromDateValue } from '~/utils/global/dateUtil'

const dateOnly = ref<DateValue>()
const dateTime = ref<DateValue>()
const sizeXs = ref<DateValue>()
const sizeSm = ref<DateValue>()
const sizeMd = ref<DateValue>()
const sizeLg = ref<DateValue>()
const disabledDate = ref<DateValue>()
const rangeStart = ref<DateValue>()
const rangeEnd = ref<DateValue>()

// datetime API 문자열 변환 데모
const dateTimeApiStr = computed(() => apiStringFromDateValue(dateTime.value) || '(없음)')
</script>

<style lang="scss" scoped>
.w-200 {
  width: 200px;
}

.w-250 {
  width: 250px;
}

.w-300 {
  width: 300px;
}

.w-380 {
  width: 380px;
}

.guide-note {
  @include typo($body-small);
  color: $color-text-muted;
  margin-bottom: $spacing-sm;
}
</style>
