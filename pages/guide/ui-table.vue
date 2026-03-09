<template>
  <div class="guide-page">
    <h1 class="guide-title">UiTable</h1>
    <p class="guide-description">컬럼 정의 기반 데이터 테이블 — 정렬, 고정 헤더, 셀 커스터마이징 지원</p>

    <!-- ============================================ -->
    <!-- 기본 사용 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">기본 사용</h2>
      <div class="guide-demo">
        <p class="demo-label">기본 테이블</p>
        <div class="demo-box">
          <UiTable
            :columns="basicColumns"
            :data="basicData"
          />
        </div>
        <pre class="demo-code">
&lt;UiTable
  :columns="[
    { key: 'name', label: '통계명', width: '320px', align: 'left' },
    { key: 'region', label: '지역', width: '150px' },
    { key: 'total', label: '합계', align: 'right' },
    { key: 'average', label: '평균', align: 'right' },
  ]"
  :data="tableData"
/&gt;</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 고정 헤더 + 스크롤 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">고정 헤더 (Sticky Header)</h2>
      <div class="guide-demo">
        <p class="demo-label">max-height="200px" + sticky-header</p>
        <div class="demo-box">
          <UiTable
            :columns="basicColumns"
            :data="scrollData"
            sticky-header
            max-height="200px"
          />
        </div>
        <pre class="demo-code">
&lt;UiTable
  :columns="columns"
  :data="data"
  sticky-header
  max-height="200px"
/&gt;</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 셀 커스터마이징 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">셀 커스터마이징 (Slot)</h2>
      <div class="guide-demo">
        <p class="demo-label">#cell-{key} 슬롯으로 셀 내용 변경</p>
        <div class="demo-box">
          <UiTable
            :columns="customColumns"
            :data="customData"
          >
            <template #cell-status="{ value }">
              <UiBadge :variant="value === '정상' ? 'success' : 'error'">
                {{ value }}
              </UiBadge>
            </template>
          </UiTable>
        </div>
        <pre class="demo-code">
&lt;UiTable :columns="columns" :data="data"&gt;
  &lt;template #cell-status="{ value }"&gt;
    &lt;UiBadge :variant="value === '정상' ? 'success' : 'error'"&gt;
      &#123;&#123; value &#125;&#125;
    &lt;/UiBadge&gt;
  &lt;/template&gt;
&lt;/UiTable&gt;</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 빈 상태 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">빈 상태 (Empty)</h2>
      <div class="guide-demo">
        <p class="demo-label">데이터가 없을 때</p>
        <div class="demo-box">
          <UiTable
            :columns="basicColumns"
            :data="[]"
            empty-text="조회된 데이터가 없습니다."
          />
        </div>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 행 클릭 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">행 클릭 이벤트</h2>
      <div class="guide-demo">
        <p class="demo-label">@row-click 이벤트 — 클릭한 행: {{ clickedRow || '없음' }}</p>
        <div class="demo-box">
          <UiTable
            :columns="basicColumns"
            :data="basicData"
            clickable
            @row-click="onRowClick"
          />
        </div>
        <pre class="demo-code">
&lt;UiTable
  :columns="columns"
  :data="data"
  clickable
  @row-click="(row, index) =&gt; console.log(row, index)"
/&gt;</pre>
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
            <td>columns</td>
            <td>TableColumn[]</td>
            <td>-</td>
            <td>컬럼 정의 배열 (필수)</td>
          </tr>
          <tr>
            <td>data</td>
            <td>Record&lt;string, any&gt;[]</td>
            <td>-</td>
            <td>행 데이터 배열 (필수)</td>
          </tr>
          <tr>
            <td>stickyHeader</td>
            <td>boolean</td>
            <td>false</td>
            <td>헤더 고정 여부</td>
          </tr>
          <tr>
            <td>maxHeight</td>
            <td>string</td>
            <td>-</td>
            <td>테이블 최대 높이 (스크롤 발생)</td>
          </tr>
          <tr>
            <td>emptyText</td>
            <td>string</td>
            <td>'데이터가 없습니다.'</td>
            <td>빈 상태 메시지</td>
          </tr>
          <tr>
            <td>clickable</td>
            <td>boolean</td>
            <td>false</td>
            <td>행 클릭 가능 여부 (hover 스타일 + 커서)</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ============================================ -->
    <!-- TableColumn 인터페이스 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">TableColumn 인터페이스</h2>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>속성</th>
            <th>Type</th>
            <th>Default</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>key</td>
            <td>string</td>
            <td>-</td>
            <td>데이터 객체의 키 (필수)</td>
          </tr>
          <tr>
            <td>label</td>
            <td>string</td>
            <td>-</td>
            <td>헤더 텍스트 (필수)</td>
          </tr>
          <tr>
            <td>width</td>
            <td>string</td>
            <td>auto</td>
            <td>컬럼 너비 ('320px', '150px' 등)</td>
          </tr>
          <tr>
            <td>align</td>
            <td>'left' | 'center' | 'right'</td>
            <td>'center'</td>
            <td>바디 셀 정렬</td>
          </tr>
          <tr>
            <td>headerAlign</td>
            <td>'left' | 'center' | 'right'</td>
            <td>'center'</td>
            <td>헤더 셀 정렬</td>
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
            <th>Props</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>#cell-{key}</td>
            <td>{ row, value, index }</td>
            <td>바디 셀 커스터마이징</td>
          </tr>
          <tr>
            <td>#header-{key}</td>
            <td>{ column }</td>
            <td>헤더 셀 커스터마이징</td>
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
            <td>@row-click</td>
            <td>(row, index)</td>
            <td>행 클릭 시 발생</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/types/table'

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================

// 기본 테이블
const basicColumns: TableColumn[] = [
  { key: 'name', label: '통계명', width: '320px', align: 'left' },
  { key: 'region', label: '지역', width: '150px' },
  { key: 'total', label: '합계', align: 'right' },
  { key: 'average', label: '평균', align: 'right' },
]

const basicData = [
  { name: 'BF.총매출액.케이블플랫폼매출액', region: '대전', total: '44,865,368,290', average: '3,738,780,690.83' },
  { name: 'BF.총매출액.케이블플랫폼매출액', region: '서울', total: '52,341,200,100', average: '4,361,766,675.00' },
  { name: 'BF.총매출액.SO매출액', region: '부산', total: '31,256,890,450', average: '2,604,740,870.83' },
  { name: 'BF.총매출액.SO매출액', region: '대구', total: '28,904,112,300', average: '2,408,676,025.00' },
]

// 스크롤 테스트용 (많은 행)
const scrollData = [
  ...basicData,
  { name: 'BF.영업이익.케이블영업이익', region: '인천', total: '15,230,450,000', average: '1,269,204,166.67' },
  { name: 'BF.영업이익.SO영업이익', region: '광주', total: '12,890,330,200', average: '1,074,194,183.33' },
  { name: 'BF.영업이익.SO영업이익', region: '울산', total: '9,456,780,100', average: '788,065,008.33' },
  { name: 'BF.당기순이익.케이블당기순이익', region: '세종', total: '7,234,560,000', average: '602,880,000.00' },
  { name: 'BF.당기순이익.SO당기순이익', region: '경기', total: '65,432,100,500', average: '5,452,675,041.67' },
  { name: 'BF.당기순이익.SO당기순이익', region: '강원', total: '4,567,890,300', average: '380,657,525.00' },
]

// 셀 커스터마이징용
const customColumns: TableColumn[] = [
  { key: 'name', label: '서비스명', width: '200px', align: 'left' },
  { key: 'region', label: '지역', width: '120px' },
  { key: 'count', label: '건수', align: 'right' },
  { key: 'status', label: '상태', width: '100px' },
]

const customData = [
  { name: '케이블 인터넷', region: '서울', count: '1,234', status: '정상' },
  { name: 'IPTV 서비스', region: '부산', count: '567', status: '점검' },
  { name: '유선전화', region: '대구', count: '890', status: '정상' },
]

// 행 클릭 테스트
const clickedRow = ref('')

const onRowClick = (row: Record<string, any>) => {
  clickedRow.value = `${row.name} (${row.region})`
}
</script>
