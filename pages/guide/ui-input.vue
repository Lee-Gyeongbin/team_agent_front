<template>
  <div class="guide-page">
    <h1 class="guide-title">UiInput</h1>
    <p class="guide-description">v-model 지원 텍스트 입력 — size, 검색 타입, 아이콘 슬롯 지원</p>

    <!-- ============================================ -->
    <!-- 기본 사용 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">기본 사용</h2>
      <div class="guide-demo">
        <p class="demo-label">v-model: "{{ basicValue }}"</p>
        <div class="demo-box">
          <div style="max-width: 320px">
            <UiInput
              v-model="basicValue"
              placeholder="텍스트를 입력하세요"
            />
          </div>
        </div>
        <pre class="demo-code">&lt;UiInput v-model="value" placeholder="텍스트를 입력하세요" /&gt;</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 검색 타입 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">검색 타입 (type="search")</h2>
      <div class="guide-demo">
        <p class="demo-label">우측 검색 아이콘 자동 표시 + @search, @enter 이벤트</p>
        <div class="demo-box">
          <div style="max-width: 320px">
            <UiInput
              v-model="searchValue"
              type="search"
              placeholder="검색어를 입력하세요"
              @search="onSearch"
              @enter="onSearch"
            />
          </div>
          <p
            v-if="searchResult"
            style="margin-top: 8px; font-size: 14px; color: #64748b"
          >
            검색: "{{ searchResult }}"
          </p>
        </div>
        <pre class="demo-code">
&lt;UiInput
  v-model="searchValue"
  type="search"
  placeholder="검색어를 입력하세요"
  @search="onSearch"
  @enter="onSearch"
/&gt;</pre
        >
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 사이즈 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">사이즈 (size)</h2>
      <div class="guide-demo">
        <p class="demo-label">xs(26px) / sm(28px) / md(30px) / lg(32px) / xlg(36px)</p>
        <div class="demo-box">
          <div style="display: flex; flex-direction: column; gap: 8px; max-width: 320px">
            <UiInput
              v-for="s in sizes"
              :key="s"
              :size="s"
              :placeholder="`size=${s}`"
            />
          </div>
        </div>
        <pre class="demo-code">
&lt;UiInput size="xs" placeholder="size=xs" /&gt;
&lt;UiInput size="sm" placeholder="size=sm" /&gt;
&lt;UiInput size="md" placeholder="size=md" /&gt;
&lt;UiInput size="lg" placeholder="size=lg" /&gt;
&lt;UiInput size="xlg" placeholder="size=xlg" /&gt;</pre
        >
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 아이콘 슬롯 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">아이콘 슬롯</h2>
      <div class="guide-demo">
        <p class="demo-label">#icon-left, #icon-right 슬롯</p>
        <div class="demo-box">
          <div style="display: flex; flex-direction: column; gap: 8px; max-width: 320px">
            <UiInput placeholder="왼쪽 아이콘">
              <template #icon-left>
                <i class="icon-search size-16" />
              </template>
            </UiInput>
            <UiInput placeholder="오른쪽 아이콘">
              <template #icon-right>
                <i class="icon-close size-16" />
              </template>
            </UiInput>
          </div>
        </div>
        <pre class="demo-code">
&lt;UiInput placeholder="왼쪽 아이콘"&gt;
  &lt;template #icon-left&gt;
    &lt;i class="icon-search size-16" /&gt;
  &lt;/template&gt;
&lt;/UiInput&gt;</pre
        >
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 숫자 전용 (number-only) -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">숫자 전용 (number-only)</h2>
      <div class="guide-demo">
        <p class="demo-label">한글 IME 환경에서도 숫자만 입력 — type="number" 대체</p>
        <div class="demo-box">
          <div style="display: flex; flex-direction: column; gap: 8px; max-width: 320px">
            <p style="font-size: 13px; color: #64748b">정수만: "{{ numberValue }}"</p>
            <UiInput
              v-model="numberValue"
              number-only
              placeholder="정수만 입력"
            />
            <p style="font-size: 13px; color: #64748b">소수점 허용: "{{ decimalValue }}"</p>
            <UiInput
              v-model="decimalValue"
              number-only
              allow-decimal
              placeholder="소수점 허용 (예: 0.85)"
            />
            <p style="font-size: 13px; color: #64748b">음수 허용: "{{ negativeValue }}"</p>
            <UiInput
              v-model="negativeValue"
              number-only
              allow-negative
              placeholder="음수 허용 (예: -100)"
            />
          </div>
        </div>
        <pre class="demo-code">
&lt;!-- 정수만 --&gt;
&lt;UiInput v-model="value" number-only /&gt;

&lt;!-- 소수점 허용 --&gt;
&lt;UiInput v-model="value" number-only allow-decimal /&gt;

&lt;!-- 음수 허용 --&gt;
&lt;UiInput v-model="value" number-only allow-negative /&gt;</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 상태 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">상태</h2>
      <div class="guide-demo">
        <p class="demo-label">disabled / readonly</p>
        <div class="demo-box">
          <div style="display: flex; flex-direction: column; gap: 8px; max-width: 320px">
            <UiInput
              placeholder="disabled"
              disabled
            />
            <UiInput
              model-value="readonly 텍스트"
              readonly
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- Props 테이블 -->
    <!-- ============================================ -->
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
            <td>string | number</td>
            <td>''</td>
            <td>v-model 바인딩 값</td>
          </tr>
          <tr>
            <td>type</td>
            <td>'text' | 'search' | 'password'</td>
            <td>'text'</td>
            <td>입력 타입 (search 시 검색 아이콘 자동 표시)</td>
          </tr>
          <tr>
            <td>placeholder</td>
            <td>string</td>
            <td>''</td>
            <td>플레이스홀더</td>
          </tr>
          <tr>
            <td>size</td>
            <td>'xs' | 'sm' | 'md' | 'lg' | 'xlg'</td>
            <td>'md'</td>
            <td>높이 사이즈</td>
          </tr>
          <tr>
            <td>radius</td>
            <td>'sm' | 'base' | 'lg'</td>
            <td>'base'</td>
            <td>둥글기</td>
          </tr>
          <tr>
            <td>numberOnly</td>
            <td>boolean</td>
            <td>false</td>
            <td>숫자만 입력 허용 (한글 IME 안전, type="number" 대체)</td>
          </tr>
          <tr>
            <td>allowDecimal</td>
            <td>boolean</td>
            <td>false</td>
            <td>numberOnly 시 소수점(.) 허용</td>
          </tr>
          <tr>
            <td>allowNegative</td>
            <td>boolean</td>
            <td>false</td>
            <td>numberOnly 시 음수(-) 허용</td>
          </tr>
          <tr>
            <td>disabled</td>
            <td>boolean</td>
            <td>false</td>
            <td>비활성 상태</td>
          </tr>
          <tr>
            <td>readonly</td>
            <td>boolean</td>
            <td>false</td>
            <td>읽기 전용</td>
          </tr>
          <tr>
            <td>name</td>
            <td>string</td>
            <td>-</td>
            <td>input name 속성</td>
          </tr>
          <tr>
            <td>id</td>
            <td>string</td>
            <td>-</td>
            <td>input id 속성</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ============================================ -->
    <!-- Events -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">Events</h2>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Payload</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>@update:modelValue</td>
            <td>(value: string)</td>
            <td>입력값 변경 시 (v-model)</td>
          </tr>
          <tr>
            <td>@enter</td>
            <td>(value)</td>
            <td>엔터키 입력 시</td>
          </tr>
          <tr>
            <td>@search</td>
            <td>(value)</td>
            <td>검색 아이콘 클릭 시 (type="search")</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ============================================ -->
    <!-- Slots -->
    <!-- ============================================ -->
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
          <tr>
            <td>#icon-left</td>
            <td>좌측 아이콘</td>
          </tr>
          <tr>
            <td>#icon-right</td>
            <td>우측 아이콘 (type="search" 시 자동 표시되므로 불필요)</td>
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

const basicValue = ref('')
const searchValue = ref('')
const searchResult = ref('')
const numberValue = ref('')
const decimalValue = ref('')
const negativeValue = ref('')

const sizes = ['xs', 'sm', 'md', 'lg', 'xlg'] as const

const onSearch = (value: string | number | undefined) => {
  searchResult.value = String(value || '')
}
</script>
