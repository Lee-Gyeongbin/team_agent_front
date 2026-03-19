<template>
  <div class="guide-page">
    <NuxtLink
      to="/guide"
      class="guide-back"
    >
      ← 가이드 목록
    </NuxtLink>
    <h1 class="guide-title">UiPagination</h1>
    <p class="guide-description">v-model 지원 페이지네이션 — 총 건수, 이전/다음, 페이지 번호, 말줄임(…)</p>

    <!-- 기본 사용 -->
    <section class="guide-section">
      <h2 class="section-title">기본 사용</h2>
      <div class="guide-demo">
        <p class="demo-label">currentPage: {{ page1 }}</p>
        <div class="demo-box">
          <UiPagination
            v-model="page1"
            :total-count="60"
            :page-size="5"
          />
        </div>
        <pre class="demo-code">&lt;UiPagination v-model="page" :total-count="60" :page-size="5" /&gt;</pre>
      </div>
    </section>

    <!-- totalLabel 커스텀 -->
    <section class="guide-section">
      <h2 class="section-title">totalLabel 커스텀</h2>
      <div class="guide-demo">
        <p class="demo-label">currentPage: {{ page2 }}</p>
        <div class="demo-box">
          <UiPagination
            v-model="page2"
            :total-count="166"
            :page-size="10"
            total-label="개 문서"
          />
        </div>
        <pre class="demo-code">&lt;UiPagination v-model="page" :total-count="166" :page-size="10" total-label="개 문서" /&gt;</pre>
      </div>
    </section>

    <!-- 적은 데이터 (말줄임 없음) -->
    <section class="guide-section">
      <h2 class="section-title">적은 페이지 (7 이하)</h2>
      <div class="guide-demo">
        <p class="demo-label">currentPage: {{ page3 }}</p>
        <div class="demo-box">
          <UiPagination
            v-model="page3"
            :total-count="30"
            :page-size="5"
          />
        </div>
        <pre class="demo-code">&lt;UiPagination v-model="page" :total-count="30" :page-size="5" /&gt;</pre>
      </div>
    </section>

    <!-- 데이터 0건 -->
    <section class="guide-section">
      <h2 class="section-title">데이터 0건</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiPagination
            v-model="pageEmpty"
            :total-count="0"
          />
        </div>
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
          <tr>
            <td>modelValue</td>
            <td>number</td>
            <td>-</td>
            <td>현재 페이지 (v-model)</td>
          </tr>
          <tr>
            <td>totalCount</td>
            <td>number</td>
            <td>-</td>
            <td>전체 데이터 수</td>
          </tr>
          <tr>
            <td>pageSize</td>
            <td>number</td>
            <td>5</td>
            <td>페이지당 행 수</td>
          </tr>
          <tr>
            <td>totalLabel</td>
            <td>string</td>
            <td>'개'</td>
            <td>총 건수 뒤 단위 텍스트 (예: '개 문서')</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
const page1 = ref(1)
const page2 = ref(1)
const page3 = ref(1)
const pageEmpty = ref(1)
</script>
