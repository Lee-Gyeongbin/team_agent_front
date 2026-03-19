<template>
  <div class="guide-page">
    <h1 class="guide-title">UiSettingSection</h1>
    <p class="guide-description">접기/펼치기 가능한 설정 섹션 컴포넌트 — Agent, LLM, 데이터셋 등 설정 폼에서 공통 사용</p>

    <!-- 데모 1: 고정 타이틀 (접기 불가) -->
    <div class="guide-demo">
      <p class="demo-label">고정 타이틀 (접기 불가)</p>
      <div class="demo-box">
        <UiSettingSection title="기본 설정">
          <UiFormField label="이름">
            <UiInput
              v-model="demoName"
              placeholder="예: GPT-4o"
              size="sm"
            />
          </UiFormField>
          <UiFormField
            label="설명"
            align-top
          >
            <UiTextarea
              v-model="demoDesc"
              placeholder="설명을 입력하세요"
              :rows="2"
              size="sm"
              :border="true"
            />
          </UiFormField>
        </UiSettingSection>
      </div>
      <pre class="demo-code">
&lt;UiSettingSection title="기본 설정"&gt;
  &lt;UiFormField label="이름"&gt;
    &lt;UiInput v-model="name" size="sm" /&gt;
  &lt;/UiFormField&gt;
&lt;/UiSettingSection&gt;</pre>
    </div>

    <!-- 데모 2: 접기/펼치기 -->
    <div class="guide-demo">
      <p class="demo-label">접기/펼치기 (collapsible)</p>
      <div class="demo-box">
        <UiSettingSection
          title="고급 설정"
          collapsible
        >
          <UiFormField
            label="유사도 임계값"
            required
            hint="이 값 이상의 유사도를 가진 문서만 검색"
            unit="(0.0~1.0)"
          >
            <UiInput
              v-model="demoThreshold"
              number-only
              allow-decimal
              size="sm"
            />
          </UiFormField>
          <UiFormField
            label="최대 검색 결과"
            required
            hint="최대로 검색할 문서 청크 수"
            unit="개"
          >
            <UiInput
              v-model="demoMaxResults"
              number-only
              size="sm"
            />
          </UiFormField>
        </UiSettingSection>
      </div>
      <pre class="demo-code">
&lt;UiSettingSection title="고급 설정" collapsible&gt;
  &lt;UiFormField label="임계값" required hint="설명" unit="(0.0~1.0)"&gt;
    &lt;UiInput v-model="val" number-only allow-decimal size="sm" /&gt;
  &lt;/UiFormField&gt;
&lt;/UiSettingSection&gt;</pre>
    </div>

    <!-- 데모 3: 기본 접힌 상태 -->
    <div class="guide-demo">
      <p class="demo-label">기본 접힌 상태 (default-collapsed)</p>
      <div class="demo-box">
        <UiSettingSection
          title="추가 옵션"
          collapsible
          default-collapsed
        >
          <UiFormField label="옵션 A">
            <UiInput
              v-model="demoOption"
              size="sm"
            />
          </UiFormField>
        </UiSettingSection>
      </div>
      <pre class="demo-code">
&lt;UiSettingSection title="추가 옵션" collapsible default-collapsed&gt;
  ...
&lt;/UiSettingSection&gt;</pre>
    </div>

    <!-- 데모 4: 라벨 너비 조정 -->
    <div class="guide-demo">
      <p class="demo-label">라벨 너비 조정 (label-width)</p>
      <div class="demo-box">
        <UiSettingSection
          title="임베딩 설정"
          collapsible
          label-width="120px"
        >
          <UiFormField label="임베딩 모델">
            <UiSelect
              v-model="demoModel"
              :options="[
                { label: 'text-embedding-3-large', value: 'large' },
                { label: 'text-embedding-3-small', value: 'small' },
              ]"
              size="sm"
            />
          </UiFormField>
          <UiFormField
            label="Pooling 전략"
            hint="벡터 생성 방식"
          >
            <UiSelect
              v-model="demoPooling"
              :options="[
                { label: 'Mean pooling', value: 'mean' },
                { label: 'CLS pooling', value: 'cls' },
              ]"
              size="sm"
            />
          </UiFormField>
        </UiSettingSection>
      </div>
      <pre class="demo-code">
&lt;UiSettingSection title="임베딩 설정" collapsible label-width="120px"&gt;
  &lt;UiFormField label="임베딩 모델"&gt;
    &lt;UiSelect v-model="model" :options="options" size="sm" /&gt;
  &lt;/UiFormField&gt;
&lt;/UiSettingSection&gt;</pre>
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
            <td>title</td>
            <td>string</td>
            <td>-</td>
            <td>섹션 타이틀 (필수)</td>
          </tr>
          <tr>
            <td>collapsible</td>
            <td>boolean</td>
            <td>false</td>
            <td>접기/펼치기 활성화</td>
          </tr>
          <tr>
            <td>defaultCollapsed</td>
            <td>boolean</td>
            <td>false</td>
            <td>초기 접힌 상태</td>
          </tr>
          <tr>
            <td>labelWidth</td>
            <td>string</td>
            <td>''</td>
            <td>라벨 너비 CSS 값 (예: '120px')</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const demoName = ref('')
const demoDesc = ref('')
const demoThreshold = ref('0.7')
const demoMaxResults = ref('5')
const demoOption = ref('')
const demoModel = ref('large')
const demoPooling = ref('mean')
</script>
