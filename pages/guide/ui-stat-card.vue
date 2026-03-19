<template>
  <div class="guide-page">
    <h1 class="guide-title">UiStatCard</h1>
    <p class="guide-description">요약 통계 카드 — 아이콘 + 라벨 + 값 + 부가 정보</p>

    <!-- 데모 1: 기본 -->
    <div class="guide-demo">
      <p class="demo-label">기본 사용</p>
      <div class="demo-box">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px">
          <UiStatCard
            icon="icon-version"
            label="전체"
            value="24건"
            color="blue"
          />
          <UiStatCard
            icon="icon-vector"
            label="활성"
            value="18건"
            color="purple"
          />
          <UiStatCard
            icon="icon-search"
            label="비활성"
            value="6건"
            color="green"
          />
          <UiStatCard
            icon="icon-datasource"
            label="데이터 소스"
            value="12"
            color="orange"
          />
        </div>
      </div>
      <pre class="demo-code">
&lt;UiStatCard icon="icon-version" label="전체" value="24건" color="blue" /&gt;
&lt;UiStatCard icon="icon-vector" label="활성" value="18건" color="purple" /&gt;</pre>
    </div>

    <!-- 데모 2: sub 텍스트 -->
    <div class="guide-demo">
      <p class="demo-label">부가 정보 (sub)</p>
      <div class="demo-box">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px">
          <UiStatCard
            icon="icon-dataset"
            label="전체 데이터셋"
            value="15"
            sub="활성: 12개, 비활성: 3개"
            color="blue"
          />
          <UiStatCard
            icon="icon-vector"
            label="벡터 인덱스"
            value="1,240,000"
            sub="총 벡터 수"
            color="purple"
          />
          <UiStatCard
            icon="icon-datasource"
            label="데이터 소스"
            value="8"
            color="orange"
          >
            <template #sub>
              문서 <strong>5</strong>개, URL <strong>3</strong>개
            </template>
          </UiStatCard>
        </div>
      </div>
      <pre class="demo-code">
&lt;UiStatCard icon="icon-dataset" label="전체" value="15" sub="활성: 12개" color="blue" /&gt;

&lt;!-- sub 슬롯 --&gt;
&lt;UiStatCard icon="icon-datasource" label="소스" value="8" color="orange"&gt;
  &lt;template #sub&gt;문서 &lt;strong&gt;5&lt;/strong&gt;개&lt;/template&gt;
&lt;/UiStatCard&gt;</pre>
    </div>

    <!-- 데모 3: 색상 변형 -->
    <div class="guide-demo">
      <p class="demo-label">색상 (color)</p>
      <div class="demo-box">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px">
          <UiStatCard
            icon="icon-sparkle"
            label="Blue"
            value="100"
            color="blue"
          />
          <UiStatCard
            icon="icon-sparkle"
            label="Purple"
            value="200"
            color="purple"
          />
          <UiStatCard
            icon="icon-sparkle"
            label="Green"
            value="300"
            color="green"
          />
          <UiStatCard
            icon="icon-sparkle"
            label="Orange"
            value="400"
            color="orange"
          />
          <UiStatCard
            icon="icon-sparkle"
            label="Red"
            value="500"
            color="red"
          />
          <UiStatCard
            icon="icon-sparkle"
            label="Gray"
            value="600"
            color="gray"
          />
        </div>
      </div>
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
            <td>icon</td>
            <td>string</td>
            <td>-</td>
            <td>아이콘 클래스 (필수)</td>
          </tr>
          <tr>
            <td>label</td>
            <td>string</td>
            <td>-</td>
            <td>라벨 텍스트 (필수)</td>
          </tr>
          <tr>
            <td>value</td>
            <td>string | number</td>
            <td>''</td>
            <td>값 (슬롯으로 대체 가능)</td>
          </tr>
          <tr>
            <td>sub</td>
            <td>string</td>
            <td>''</td>
            <td>부가 정보 (#sub 슬롯 대체 가능)</td>
          </tr>
          <tr>
            <td>color</td>
            <td>'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray'</td>
            <td>'blue'</td>
            <td>아이콘 배경 색상</td>
          </tr>
          <tr>
            <td>iconSize</td>
            <td>number</td>
            <td>24</td>
            <td>아이콘 크기 (px)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
