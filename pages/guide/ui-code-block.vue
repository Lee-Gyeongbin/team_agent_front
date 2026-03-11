<template>
  <div class="guide-page">
    <NuxtLink
      to="/guide"
      class="guide-back"
    >
      ← 가이드 목록
    </NuxtLink>
    <h1 class="guide-title">UiCodeBlock</h1>
    <p class="guide-description">코드 표시 + 복사 버튼 내장 코드 블록 컴포넌트</p>

    <!-- 기본 사용 -->
    <section class="guide-section">
      <h2 class="section-title">기본 사용</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiCodeBlock :code="sqlCode" />
        </div>
        <pre class="demo-code">&lt;UiCodeBlock :code="sqlCode" /&gt;</pre>
      </div>
    </section>

    <!-- 짧은 코드 -->
    <section class="guide-section">
      <h2 class="section-title">짧은 코드</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiCodeBlock :code="shortCode" />
        </div>
        <pre class="demo-code">&lt;UiCodeBlock code="SELECT * FROM users WHERE id = 1;" /&gt;</pre>
      </div>
    </section>

    <!-- 긴 코드 (스크롤) -->
    <section class="guide-section">
      <h2 class="section-title">긴 코드 (스크롤)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiCodeBlock :code="longCode" />
        </div>
        <pre class="demo-code">&lt;UiCodeBlock :code="longCode" /&gt;
// max-height: 260px 초과 시 스크롤 자동 활성화</pre>
      </div>
    </section>

    <!-- Props -->
    <section class="guide-section">
      <h2 class="section-title">Props</h2>
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
            <td><code>code</code></td>
            <td><code>string</code></td>
            <td>-</td>
            <td>표시할 코드 텍스트 (필수)</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- 기능 -->
    <section class="guide-section">
      <h2 class="section-title">기능</h2>
      <table class="guide-props-table">
        <thead>
          <tr>
            <th>기능</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>복사 버튼</td>
            <td>우측 상단 아이콘 클릭 시 클립보드 복사, 2초간 체크 아이콘 피드백</td>
          </tr>
          <tr>
            <td>스크롤</td>
            <td>max-height 260px 초과 시 자동 스크롤</td>
          </tr>
          <tr>
            <td>다크 테마</td>
            <td>고정 다크 배경 (#1e1e2e) + 모노스페이스 폰트</td>
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
const sqlCode = `SELECT
  department_name,
  COUNT(*) AS employee_count,
  AVG(salary) AS avg_salary
FROM employees e
JOIN departments d ON e.dept_id = d.id
WHERE e.status = 'active'
GROUP BY department_name
ORDER BY avg_salary DESC
LIMIT 10;`

const shortCode = `SELECT * FROM users WHERE id = 1;`

const longCode = `-- 월별 매출 집계 + 전월 대비 증감률
WITH monthly_sales AS (
  SELECT
    TO_CHAR(sale_date, 'YYYY-MM') AS month,
    SUM(amount) AS total_amount,
    COUNT(*) AS sale_count,
    COUNT(DISTINCT customer_id) AS unique_customers
  FROM sales
  WHERE sale_date >= '2024-01-01'
    AND sale_date < '2025-01-01'
  GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
),
with_prev AS (
  SELECT
    month,
    total_amount,
    sale_count,
    unique_customers,
    LAG(total_amount) OVER (ORDER BY month) AS prev_amount
  FROM monthly_sales
)
SELECT
  month,
  total_amount,
  sale_count,
  unique_customers,
  ROUND((total_amount - prev_amount) / prev_amount * 100, 1) AS growth_rate
FROM with_prev
ORDER BY month;`
</script>
