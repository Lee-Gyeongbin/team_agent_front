<template>
  <div class="guide-page">
    <h1 class="guide-title">UiStatusBadge</h1>
    <p class="guide-description">상태 표시 뱃지 — active/inactive/draft/pending/error/success</p>

    <!-- 데모 1: 기본 상태 -->
    <div class="guide-demo">
      <p class="demo-label">기본 상태 (자동 라벨)</p>
      <div class="demo-box">
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
          <UiStatusBadge status="active" />
          <UiStatusBadge status="inactive" />
          <UiStatusBadge status="draft" />
          <UiStatusBadge status="pending" />
          <UiStatusBadge status="error" />
          <UiStatusBadge status="success" />
        </div>
      </div>
      <pre class="demo-code">
&lt;UiStatusBadge status="active" /&gt;
&lt;UiStatusBadge status="inactive" /&gt;
&lt;UiStatusBadge status="draft" /&gt;</pre>
    </div>

    <!-- 데모 2: 커스텀 라벨 -->
    <div class="guide-demo">
      <p class="demo-label">커스텀 라벨</p>
      <div class="demo-box">
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
          <UiStatusBadge
            status="active"
            label="배포됨"
          />
          <UiStatusBadge
            status="pending"
            label="검토중"
          />
          <UiStatusBadge
            status="error"
            label="실패"
          />
          <UiStatusBadge
            status="inactive"
            label="중지됨"
          />
        </div>
      </div>
      <pre class="demo-code">
&lt;UiStatusBadge status="active" label="배포됨" /&gt;
&lt;UiStatusBadge status="pending" label="검토중" /&gt;</pre>
    </div>

    <!-- 데모 3: 크기 -->
    <div class="guide-demo">
      <p class="demo-label">크기 (size)</p>
      <div class="demo-box">
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
          <UiStatusBadge
            status="active"
            size="sm"
          />
          <UiStatusBadge
            status="active"
            size="md"
          />
        </div>
      </div>
      <pre class="demo-code">
&lt;UiStatusBadge status="active" size="sm" /&gt;
&lt;UiStatusBadge status="active" size="md" /&gt;</pre>
    </div>

    <!-- 데모 4: 실사용 예시 -->
    <div class="guide-demo">
      <p class="demo-label">실사용 예시: 프롬프트 버전</p>
      <div class="demo-box">
        <div style="display: flex; flex-direction: column; gap: 8px">
          <div style="display: flex; align-items: center; gap: 8px">
            <strong>버전 3.1</strong>
            <UiStatusBadge status="active" />
          </div>
          <div style="display: flex; align-items: center; gap: 8px">
            <strong>버전 2.0</strong>
            <UiStatusBadge
              status="inactive"
              label="이전 버전"
            />
          </div>
          <div style="display: flex; align-items: center; gap: 8px">
            <strong>버전 4.0</strong>
            <UiStatusBadge
              status="draft"
              label="초안"
            />
          </div>
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
            <td>status</td>
            <td>'active' | 'inactive' | 'draft' | 'pending' | 'error' | 'success'</td>
            <td>'active'</td>
            <td>상태 (색상 결정)</td>
          </tr>
          <tr>
            <td>label</td>
            <td>string</td>
            <td>''</td>
            <td>커스텀 라벨 (미지정 시 status에 따라 자동)</td>
          </tr>
          <tr>
            <td>size</td>
            <td>'sm' | 'md'</td>
            <td>'sm'</td>
            <td>크기</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
