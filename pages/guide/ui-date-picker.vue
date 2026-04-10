<template>
  <div class="guide-page">
    <NuxtLink
      to="/guide"
      class="guide-back"
    >
      ← 가이드 목록
    </NuxtLink>
    <h1 class="guide-title">UiDatePicker</h1>
    <p class="guide-description">
      Radix-vue DatePicker 기반 날짜/시간 선택 컴포넌트 — 한국어 로케일, 세그먼트 입력, 캘린더 팝업. datetime 모드에서는
      날짜(캘린더)와 시간(직접 입력)이 분리되어 표시됩니다. type=month 는 연·월만 선택하며 값은 항상 해당 월의
      1일(CalendarDate)입니다.
    </p>

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

    <!-- 연·월만 선택 -->
    <section class="guide-section">
      <h2 class="section-title">연·월만 선택 (type=month)</h2>
      <p class="guide-note">
        <code>datetime</code> 과 동시에 쓰는 옵션은 없습니다(시간 UI 없음). 스크립트에서는
        <code>ref&lt;DateValue | undefined&gt;</code> 또는 조회 시 파싱한 <code>CalendarDate</code> 를 그대로 넣으면
        됩니다. 값은 항상 해당 월의 1일입니다.
      </p>

      <div class="guide-demo">
        <p class="demo-label">기본</p>
        <div class="demo-box">
          <div class="w-220">
            <UiDatePicker
              v-model="monthOnly"
              type="month"
            />
          </div>
          <p class="demo-result">선택값(toString): {{ monthOnly?.toString() || '(없음)' }}</p>
          <p class="demo-result">동일 값으로 <code>apiStringFromDateValue</code> 시(참고): {{ monthOnlyApiStr }}</p>
        </div>
        <pre class="demo-code">
&lt;UiDatePicker v-model="month" type="month" /&gt;

// script: ref&lt;DateValue | undefined&gt;() 또는 CalendarDate 초기값
        </pre>
      </div>

      <div class="guide-demo">
        <p class="demo-label">minValue / maxValue (월 그리드·연 이동에 반영)</p>
        <p class="guide-note guide-note--best">
          <strong>BEST PRACTICE</strong> — <code>minValue</code> · <code>maxValue</code>는 템플릿에서
          <code>new CalendarDate(...)</code>를 직접 쓰기보다, 스크립트에서 상수(또는 <code>computed</code>)로 두고
          바인딩하는 편이 렌더마다 객체를 새로 만들지 않아 읽기도 좋습니다. 아래 라이브 데모·예시 코드와 같이
          사용하세요.
        </p>
        <div class="demo-box">
          <div class="w-220">
            <UiDatePicker
              v-model="monthBounded"
              type="month"
              :min-value="monthPickerMin"
              :max-value="monthPickerMax"
            />
          </div>
          <p class="demo-result">
            선택값: {{ monthBounded?.toString() || '(없음)' }} · 허용 범위 2024-01 ~ 2025-12 (예시)
          </p>
        </div>
        <pre class="demo-code">
// 상수로 두고 템플릿에는 넘기기만
const monthPickerMin = new CalendarDate(2024, 1, 1)
const monthPickerMax = new CalendarDate(2025, 12, 31)

&lt;UiDatePicker
  v-model="month"
  type="month"
  :min-value="monthPickerMin"
  :max-value="monthPickerMax"
/&gt;
        </pre>
      </div>

      <div class="guide-demo">
        <p class="demo-label">비활성</p>
        <div class="demo-box">
          <div class="w-220">
            <UiDatePicker
              v-model="monthDisabled"
              type="month"
              disabled
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiDatePicker v-model="month" type="month" disabled /&gt;</pre>
      </div>

      <div class="guide-demo">
        <p class="demo-label">API가 YYYY-MM 만 필요할 때</p>
        <pre class="demo-code">
const y = month?.year
const m = month?.month
const apiYm = y &amp;&amp; m ? `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}` : ''
// 또는 apiStringFromDateValue(month)?.slice(0, 7)
        </pre>
      </div>
    </section>

    <!-- 프론트 저장 사용법 -->
    <section class="guide-section">
      <h2 class="section-title">프론트 저장 사용법</h2>

      <div class="guide-demo">
        <p class="demo-label">1. API 문자열 → DateValue (조회 시)</p>
        <pre class="demo-code">
import { dateValueFromApiString } from '~/utils/global/dateUtil'

const startDt = dateValueFromApiString('2026-03-16 09:30:00')
// → CalendarDateTime { year: 2026, month: 3, day: 16, hour: 9, minute: 30 }
        </pre>
      </div>

      <div class="guide-demo">
        <p class="demo-label">2. DateValue → API 문자열 (저장 시)</p>
        <pre class="demo-code">
import { apiStringFromDateValue } from '~/utils/global/dateUtil'

const apiStr = apiStringFromDateValue(startDt)
// → '2026-03-16 09:30:00'
        </pre>
      </div>

      <div class="guide-demo">
        <p class="demo-label">3. 실제 사용 패턴 (Store에서)</p>
        <pre class="demo-code">
// computed로 DatePicker ↔ API 문자열 양방향 바인딩
const startDt = computed({
  get: () => dateValueFromApiString(row.value.startDt),
  set: (v: DateValue | undefined) => {
    row.value.startDt = apiStringFromDateValue(v)
  },
})
        </pre>
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
      <table class="guide-status-table">
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
            <td>'date' | 'datetime' | 'month'</td>
            <td>'date'</td>
            <td>날짜만 / 날짜+시간 / 연·월만(값은 해당월 1일)</td>
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
            <td>선택 가능 최소 날짜·시각( type=month 는 월 단위로 범위 판정)</td>
          </tr>
          <tr>
            <td>maxValue</td>
            <td>DateValue</td>
            <td>-</td>
            <td>선택 가능 최대 날짜·시각( type=month 는 월 단위로 범위 판정)</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { CalendarDate } from '@internationalized/date'
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
const monthOnly = ref<DateValue>()
const monthBounded = ref<DateValue | undefined>(new CalendarDate(2024, 6, 1))
const monthDisabled = ref<DateValue | undefined>(new CalendarDate(2025, 1, 1))

const monthPickerMin = new CalendarDate(2024, 1, 1)
const monthPickerMax = new CalendarDate(2025, 12, 31)

// datetime API 문자열 변환 데모
const dateTimeApiStr = computed(() => apiStringFromDateValue(dateTime.value) || '(없음)')
const monthOnlyApiStr = computed(() => apiStringFromDateValue(monthOnly.value) || '(없음)')
</script>

<style lang="scss" scoped>
.w-200 {
  width: 200px;
}

.w-250 {
  width: 250px;
}

.w-220 {
  width: 220px;
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
