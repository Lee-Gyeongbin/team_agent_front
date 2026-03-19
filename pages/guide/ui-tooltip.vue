<template>
  <div class="guide-page">
    <h1 class="guide-title">UiTooltip</h1>
    <p class="guide-description">Radix-vue 기반 툴팁 — 호버 시 설명 표시, 방향/딜레이/화살표 지원</p>

    <!-- 데모 1: 기본 -->
    <div class="guide-demo">
      <p class="demo-label">기본 사용</p>
      <div class="demo-box">
        <div style="display: flex; gap: 24px; align-items: center">
          <UiTooltip content="위쪽 툴팁입니다">
            <UiButton variant="line-secondary">
              Top (기본)
            </UiButton>
          </UiTooltip>

          <UiTooltip
            content="오른쪽 툴팁입니다"
            side="right"
          >
            <UiButton variant="line-secondary">
              Right
            </UiButton>
          </UiTooltip>

          <UiTooltip
            content="아래쪽 툴팁입니다"
            side="bottom"
          >
            <UiButton variant="line-secondary">
              Bottom
            </UiButton>
          </UiTooltip>

          <UiTooltip
            content="왼쪽 툴팁입니다"
            side="left"
          >
            <UiButton variant="line-secondary">
              Left
            </UiButton>
          </UiTooltip>
        </div>
      </div>
      <pre class="demo-code">
&lt;UiTooltip content="위쪽 툴팁입니다"&gt;
  &lt;UiButton&gt;Top&lt;/UiButton&gt;
&lt;/UiTooltip&gt;

&lt;UiTooltip content="오른쪽" side="right"&gt;
  &lt;UiButton&gt;Right&lt;/UiButton&gt;
&lt;/UiTooltip&gt;</pre>
    </div>

    <!-- 데모 2: 아이콘에 툴팁 -->
    <div class="guide-demo">
      <p class="demo-label">아이콘 + 툴팁</p>
      <div class="demo-box">
        <div style="display: flex; gap: 16px; align-items: center">
          <UiTooltip content="검색">
            <i
              class="icon-search size-20"
              style="cursor: pointer"
            />
          </UiTooltip>
          <UiTooltip content="설정">
            <i
              class="icon-settings size-20"
              style="cursor: pointer"
            />
          </UiTooltip>
          <UiTooltip content="더보기">
            <i
              class="icon-more size-20"
              style="cursor: pointer"
            />
          </UiTooltip>
        </div>
      </div>
      <pre class="demo-code">
&lt;UiTooltip content="검색"&gt;
  &lt;i class="icon-search size-20" /&gt;
&lt;/UiTooltip&gt;</pre>
    </div>

    <!-- 데모 3: 화살표 없음 + 딜레이 -->
    <div class="guide-demo">
      <p class="demo-label">옵션: 화살표 없음, 딜레이 변경</p>
      <div class="demo-box">
        <div style="display: flex; gap: 24px; align-items: center">
          <UiTooltip
            content="화살표 없는 툴팁"
            :show-arrow="false"
          >
            <UiButton variant="line-secondary">
              화살표 없음
            </UiButton>
          </UiTooltip>

          <UiTooltip
            content="0.5초 후 표시"
            :delay-duration="500"
          >
            <UiButton variant="line-secondary">
              딜레이 500ms
            </UiButton>
          </UiTooltip>

          <UiTooltip :delay-duration="0">
            <UiButton variant="line-secondary">
              커스텀 콘텐츠
            </UiButton>
            <template #content>
              <div>
                <strong>제목</strong>
                <p style="margin: 4px 0 0; opacity: 0.8">상세 설명 텍스트</p>
              </div>
            </template>
          </UiTooltip>
        </div>
      </div>
      <pre class="demo-code">
&lt;UiTooltip content="화살표 없음" :show-arrow="false"&gt;
  &lt;UiButton&gt;버튼&lt;/UiButton&gt;
&lt;/UiTooltip&gt;

&lt;!-- 커스텀 콘텐츠 --&gt;
&lt;UiTooltip&gt;
  &lt;UiButton&gt;버튼&lt;/UiButton&gt;
  &lt;template #content&gt;
    &lt;strong&gt;제목&lt;/strong&gt;
    &lt;p&gt;설명&lt;/p&gt;
  &lt;/template&gt;
&lt;/UiTooltip&gt;</pre>
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
            <td>content</td>
            <td>string</td>
            <td>''</td>
            <td>툴팁 텍스트 (#content 슬롯으로 대체 가능)</td>
          </tr>
          <tr>
            <td>side</td>
            <td>'top' | 'right' | 'bottom' | 'left'</td>
            <td>'top'</td>
            <td>표시 방향</td>
          </tr>
          <tr>
            <td>sideOffset</td>
            <td>number</td>
            <td>6</td>
            <td>트리거와의 거리 (px)</td>
          </tr>
          <tr>
            <td>align</td>
            <td>'start' | 'center' | 'end'</td>
            <td>'center'</td>
            <td>정렬 위치</td>
          </tr>
          <tr>
            <td>delayDuration</td>
            <td>number</td>
            <td>200</td>
            <td>표시 딜레이 (ms)</td>
          </tr>
          <tr>
            <td>showArrow</td>
            <td>boolean</td>
            <td>true</td>
            <td>화살표 표시 여부</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Slots -->
    <div class="guide-demo">
      <p class="demo-label">Slots</p>
      <table class="guide-props-table">
        <thead>
          <tr>
            <th>Slot</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>default</td>
            <td>트리거 요소 (호버 대상)</td>
          </tr>
          <tr>
            <td>#content</td>
            <td>커스텀 툴팁 콘텐츠 (content prop 대체)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
