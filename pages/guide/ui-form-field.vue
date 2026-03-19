<template>
  <div class="guide-page">
    <h1 class="guide-title">UiFormField</h1>
    <p class="guide-description">설정 폼의 라벨 + 인풋 행 — 필수 표시, 힌트, 단위 지원</p>

    <!-- 데모 1: 기본 -->
    <div class="guide-demo">
      <p class="demo-label">기본 사용</p>
      <div
        class="demo-box"
        style="max-width: 500px"
      >
        <div class="com-setting-section">
          <UiFormField label="이름">
            <UiInput
              v-model="demo1"
              placeholder="이름을 입력하세요"
              size="sm"
            />
          </UiFormField>
        </div>
      </div>
      <pre class="demo-code">
&lt;UiFormField label="이름"&gt;
  &lt;UiInput v-model="name" size="sm" /&gt;
&lt;/UiFormField&gt;</pre>
    </div>

    <!-- 데모 2: 필수 + 힌트 -->
    <div class="guide-demo">
      <p class="demo-label">필수 표시 + 힌트</p>
      <div
        class="demo-box"
        style="max-width: 500px"
      >
        <div class="com-setting-section">
          <UiFormField
            label="유사도 임계값"
            required
            hint="이 값 이상의 유사도를 가진 문서만 검색합니다"
          >
            <UiInput
              v-model="demo2"
              number-only
              allow-decimal
              size="sm"
            />
          </UiFormField>
        </div>
      </div>
      <pre class="demo-code">
&lt;UiFormField label="유사도 임계값" required hint="이 값 이상의 유사도를 가진 문서만 검색합니다"&gt;
  &lt;UiInput v-model="val" number-only allow-decimal size="sm" /&gt;
&lt;/UiFormField&gt;</pre>
    </div>

    <!-- 데모 3: 단위 표시 -->
    <div class="guide-demo">
      <p class="demo-label">단위 표시 (unit)</p>
      <div
        class="demo-box"
        style="max-width: 500px"
      >
        <div class="com-setting-section">
          <UiFormField
            label="최대 결과"
            required
            hint="최대로 검색할 문서 청크 수"
            unit="개"
          >
            <UiInput
              v-model="demo3"
              number-only
              size="sm"
            />
          </UiFormField>
          <UiFormField
            label="임계값"
            unit="(0.0~1.0)"
          >
            <UiInput
              v-model="demo4"
              number-only
              allow-decimal
              size="sm"
            />
          </UiFormField>
        </div>
      </div>
      <pre class="demo-code">
&lt;UiFormField label="최대 결과" required hint="설명" unit="개"&gt;
  &lt;UiInput v-model="val" number-only size="sm" /&gt;
&lt;/UiFormField&gt;</pre>
    </div>

    <!-- 데모 4: 상단 정렬 (textarea) -->
    <div class="guide-demo">
      <p class="demo-label">상단 정렬 (align-top) — Textarea용</p>
      <div
        class="demo-box"
        style="max-width: 500px"
      >
        <div class="com-setting-section">
          <UiFormField
            label="설명"
            required
            align-top
          >
            <UiTextarea
              v-model="demo5"
              placeholder="설명을 입력하세요"
              :rows="3"
              size="sm"
              :border="true"
            />
          </UiFormField>
        </div>
      </div>
      <pre class="demo-code">
&lt;UiFormField label="설명" required align-top&gt;
  &lt;UiTextarea v-model="desc" :rows="3" size="sm" :border="true" /&gt;
&lt;/UiFormField&gt;</pre>
    </div>

    <!-- Props 테이블 -->
    <div class="guide-demo">
      <p class="demo-label">Props</p>
      <table class="guide-props-table">
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
            <td>label</td>
            <td>string</td>
            <td>-</td>
            <td>라벨 텍스트 (필수)</td>
          </tr>
          <tr>
            <td>required</td>
            <td>boolean</td>
            <td>false</td>
            <td>필수 표시 (*)</td>
          </tr>
          <tr>
            <td>hint</td>
            <td>string</td>
            <td>''</td>
            <td>인풋 아래 설명 텍스트</td>
          </tr>
          <tr>
            <td>unit</td>
            <td>string</td>
            <td>''</td>
            <td>인풋 옆 단위 표시 (예: '개', '(0.0~1.0)')</td>
          </tr>
          <tr>
            <td>alignTop</td>
            <td>boolean</td>
            <td>false</td>
            <td>라벨 상단 정렬 (Textarea 등)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const demo1 = ref('')
const demo2 = ref('0.7')
const demo3 = ref('5')
const demo4 = ref('0.8')
const demo5 = ref('')
</script>
