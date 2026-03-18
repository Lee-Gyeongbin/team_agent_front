<template>
  <div class="guide-page">
    <h1 class="guide-title">UiLoading</h1>
    <p class="guide-description">데이터 로딩 중 표시하는 스피너 + 텍스트 공통 컴포넌트</p>

    <!-- ============================================ -->
    <!-- 기본 (텍스트 기본값) -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">기본</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiLoading />
        </div>
        <pre class="demo-code">&lt;UiLoading /&gt;</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 커스텀 텍스트 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">커스텀 텍스트</h2>
      <div class="guide-demo">
        <p class="demo-label">에이전트 로딩</p>
        <div class="demo-box">
          <UiLoading text="에이전트를 불러오는 중..." />
        </div>

        <p class="demo-label">데이터셋 로딩</p>
        <div class="demo-box">
          <UiLoading text="데이터셋을 불러오는 중..." />
        </div>

        <p class="demo-label">공통코드 로딩</p>
        <div class="demo-box">
          <UiLoading text="공통코드를 불러오는 중..." />
        </div>

        <pre class="demo-code">&lt;UiLoading text="에이전트를 불러오는 중..." /&gt;
&lt;UiLoading text="데이터셋을 불러오는 중..." /&gt;
&lt;UiLoading text="공통코드를 불러오는 중..." /&gt;</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- v-if 사용 예시 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">사용 패턴</h2>
      <div class="guide-demo">
        <pre class="demo-code">&lt;!-- 페이지 로딩 패턴 --&gt;
&lt;UiLoading v-if="isLoading" text="라이브러리를 불러오는 중..." /&gt;

&lt;!-- 데이터 있음 --&gt;
&lt;div v-else-if="list.length"&gt;...&lt;/div&gt;

&lt;!-- 빈 상태 --&gt;
&lt;UiEmpty v-else /&gt;</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- Props -->
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
            <td>text</td>
            <td>string</td>
            <td>'불러오는 중...'</td>
            <td>로딩 텍스트 (빈 문자열이면 텍스트 숨김)</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>
