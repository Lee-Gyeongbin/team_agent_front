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
    <!-- 오버레이 모드 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">오버레이 (dim) 모드</h2>
      <p class="guide-description">
        전체 화면을 dim 처리하고 중앙에 로딩 스피너를 표시합니다. (position: fixed)
      </p>
      <div class="guide-demo">
        <p class="demo-label">오버레이 OFF (토글로 확인)</p>
        <div
          class="demo-box"
          style="height: 240px;"
        >
          <UiLoading
            v-if="isOverlayVisible"
            overlay
            text="시각화 데이터를 불러오는 중..."
          />
          <div style="padding: 16px;">
            <p>아래 콘텐츠가 dim 처리됩니다.</p>
            <ul>
              <li>조회결과 테이블</li>
              <li>차트 추가 섹션</li>
              <li>차트 카드 목록</li>
            </ul>
          </div>
        </div>
        <div style="margin-top: 8px;">
          <UiButton
            size="sm"
            variant="secondary"
            @click="isOverlayVisible = !isOverlayVisible"
          >
            {{ isOverlayVisible ? '오버레이 끄기' : '오버레이 켜기' }}
          </UiButton>
        </div>
        <pre class="demo-code">&lt;!-- 전체 화면 dim + 중앙 스피너 (position: fixed) --&gt;
&lt;UiLoading v-if="isLoading" overlay text="시각화 데이터를 불러오는 중..." /&gt;</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- v-if 사용 예시 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">사용 패턴</h2>
      <div class="guide-demo">
        <pre class="demo-code">&lt;!-- 1. 인라인 로딩 (기본) --&gt;
&lt;UiLoading v-if="isLoading" text="라이브러리를 불러오는 중..." /&gt;
&lt;div v-else-if="list.length"&gt;...&lt;/div&gt;
&lt;UiEmpty v-else /&gt;

&lt;!-- 2. 오버레이 로딩 (전체 화면 dim) --&gt;
&lt;UiLoading v-if="isLoading" overlay text="데이터를 불러오는 중..." /&gt;</pre>
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
          <tr>
            <td>overlay</td>
            <td>boolean</td>
            <td>false</td>
            <td>오버레이(dim) 모드 — 전체 화면 fixed 처리</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const isOverlayVisible = ref(false)
</script>
