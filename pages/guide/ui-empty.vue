<template>
  <div class="guide-page">
    <h1 class="guide-title">UiEmpty</h1>
    <p class="guide-description">데이터가 없거나 선택이 필요한 빈 상태를 표시하는 공통 컴포넌트</p>

    <!-- ============================================ -->
    <!-- 기본 (텍스트만) -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">기본 (텍스트만)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiEmpty />
        </div>
        <pre class="demo-code">&lt;UiEmpty /&gt;
&lt;UiEmpty title="조회된 결과가 없습니다." /&gt;</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 아이콘 + 텍스트 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">아이콘 + 텍스트</h2>
      <div class="guide-demo">
        <p class="demo-label">검색 결과 없음</p>
        <div class="demo-box">
          <UiEmpty
            icon="icon-search"
            title="검색 결과가 없습니다."
          />
        </div>

        <p class="demo-label">선택 유도</p>
        <div class="demo-box">
          <UiEmpty
            icon="icon-arrow-right"
            title="좌측에서 그룹을 선택하세요"
          />
        </div>

        <p class="demo-label">빈 컬렉션</p>
        <div class="demo-box">
          <UiEmpty
            icon="icon-heart"
            title="마음에 드는 날리지를 저장해주세요"
          />
        </div>

        <pre class="demo-code">&lt;UiEmpty icon="icon-search" title="검색 결과가 없습니다." /&gt;
&lt;UiEmpty icon="icon-arrow-right" title="좌측에서 그룹을 선택하세요" /&gt;
&lt;UiEmpty icon="icon-heart" title="마음에 드는 날리지를 저장해주세요" /&gt;</pre>
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
            <td>icon</td>
            <td>string</td>
            <td>-</td>
            <td>아이콘 클래스명 (예: 'icon-search')</td>
          </tr>
          <tr>
            <td>title</td>
            <td>string</td>
            <td>'데이터가 없습니다.'</td>
            <td>메인 텍스트</td>
          </tr>
          <tr>
            <td>description</td>
            <td>string</td>
            <td>-</td>
            <td>보조 설명 텍스트</td>
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
            <td>default</td>
            <td>하단 액션 영역 (버튼 등)</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>
