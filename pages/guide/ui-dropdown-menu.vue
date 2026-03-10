<template>
  <div class="guide-page">
    <NuxtLink
      to="/guide"
      class="guide-back"
    >
      ← 가이드 목록
    </NuxtLink>
    <h1 class="guide-title">UiDropdownMenu</h1>
    <p class="guide-description">Radix-vue 기반 드롭다운 메뉴 — 아이콘, danger 색상, 위치 조정 지원</p>

    <!-- ============================================ -->
    <!-- 기본 사용 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">기본 사용</h2>
      <div class="guide-demo">
        <p class="demo-label">기본 드롭다운 메뉴</p>
        <div class="demo-box">
          <UiDropdownMenu
            :items="basicItems"
            @select="onSelect"
          >
            <template #trigger>
              <UiButton variant="outline">
                메뉴 열기
                <template #icon-right>
                  <i class="icon-arrow-down size-16" />
                </template>
              </UiButton>
            </template>
          </UiDropdownMenu>
          <p
            v-if="selectedValue"
            style="margin-top: 12px; color: #64748b"
          >
            선택된 값: {{ selectedValue }}
          </p>
        </div>
        <pre class="demo-code">
&lt;UiDropdownMenu
  :items="[
    { label: '보기', value: 'view', icon: 'icon-view' },
    { label: '수정', value: 'edit', icon: 'icon-edit' },
    { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' },
  ]"
  @select="(value) => console.log(value)"
&gt;
  &lt;template #trigger&gt;
    &lt;UiButton variant="outline"&gt;메뉴 열기&lt;/UiButton&gt;
  &lt;/template&gt;
&lt;/UiDropdownMenu&gt;</pre
        >
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 아이콘 사용 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">아이콘 사용</h2>
      <div class="guide-demo">
        <p class="demo-label">아이콘이 있는 메뉴 아이템</p>
        <div class="demo-box">
          <UiDropdownMenu :items="iconItems">
            <template #trigger>
              <UiButton variant="secondary">
                아이콘 메뉴
                <template #icon-right>
                  <i class="icon-arrow-down size-16" />
                </template>
              </UiButton>
            </template>
          </UiDropdownMenu>
        </div>
        <pre class="demo-code">
&lt;UiDropdownMenu
  :items="[
    { label: '보기', value: 'view', icon: 'icon-view' },
    { label: '수정', value: 'edit', icon: 'icon-edit' },
    { label: '복사', value: 'copy', icon: 'icon-copy-gray' },
  ]"
&gt;
  &lt;template #trigger&gt;
    &lt;UiButton&gt;아이콘 메뉴&lt;/UiButton&gt;
  &lt;/template&gt;
&lt;/UiDropdownMenu&gt;</pre
        >
      </div>
    </section>

    <!-- ============================================ -->
    <!-- Danger 색상 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">Danger 색상</h2>
      <div class="guide-demo">
        <p class="demo-label">위험 액션(삭제 등)은 color="danger" 지정</p>
        <div class="demo-box">
          <UiDropdownMenu :items="dangerItems">
            <template #trigger>
              <UiButton variant="ghost">
                <template #icon-left>
                  <i class="icon-more size-16" />
                </template>
              </UiButton>
            </template>
          </UiDropdownMenu>
        </div>
        <pre class="demo-code">
&lt;UiDropdownMenu
  :items="[
    { label: '수정', value: 'edit', icon: 'icon-edit' },
    { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' },
  ]"
&gt;
  &lt;template #trigger&gt;
    &lt;UiButton variant="ghost"&gt;
      &lt;template #icon-left&gt;
        &lt;i class="icon-more size-16" /&gt;
      &lt;/template&gt;
    &lt;/UiButton&gt;
  &lt;/template&gt;
&lt;/UiDropdownMenu&gt;</pre
        >
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 위치 조정 (side, align) -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">위치 조정</h2>
      <div class="guide-demo">
        <p class="demo-label">side / align 옵션으로 메뉴 위치 조정</p>
        <div class="demo-box">
          <div style="display: flex; gap: 16px; flex-wrap: wrap">
            <UiDropdownMenu
              :items="basicItems"
              side="bottom"
              align="start"
            >
              <template #trigger>
                <UiButton variant="outline">bottom-start</UiButton>
              </template>
            </UiDropdownMenu>
            <UiDropdownMenu
              :items="basicItems"
              side="bottom"
              align="end"
            >
              <template #trigger>
                <UiButton variant="outline">bottom-end</UiButton>
              </template>
            </UiDropdownMenu>
            <UiDropdownMenu
              :items="basicItems"
              side="top"
              align="start"
            >
              <template #trigger>
                <UiButton variant="outline">top-start</UiButton>
              </template>
            </UiDropdownMenu>
            <UiDropdownMenu
              :items="basicItems"
              side="right"
              align="start"
            >
              <template #trigger>
                <UiButton variant="outline">right-start</UiButton>
              </template>
            </UiDropdownMenu>
          </div>
        </div>
        <pre class="demo-code">
&lt;UiDropdownMenu
  :items="items"
  side="bottom"
  align="start"
&gt;
  &lt;template #trigger&gt;
    &lt;UiButton&gt;메뉴&lt;/UiButton&gt;
  &lt;/template&gt;
&lt;/UiDropdownMenu&gt;</pre
        >
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
            <td>items</td>
            <td>DropdownMenuItemDef[]</td>
            <td>-</td>
            <td>메뉴 아이템 배열 (필수)</td>
          </tr>
          <tr>
            <td>side</td>
            <td>'top' | 'bottom' | 'left' | 'right'</td>
            <td>'bottom'</td>
            <td>메뉴가 열리는 방향</td>
          </tr>
          <tr>
            <td>align</td>
            <td>'start' | 'center' | 'end'</td>
            <td>'end'</td>
            <td>트리거 기준 정렬</td>
          </tr>
          <tr>
            <td>sideOffset</td>
            <td>number</td>
            <td>5</td>
            <td>트리거와 메뉴 사이 간격 (px)</td>
          </tr>
          <tr>
            <td>collisionPadding</td>
            <td>number</td>
            <td>8</td>
            <td>뷰포트 경계와의 최소 여백 — flip 기준 (px)</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ============================================ -->
    <!-- DropdownMenuItemDef 인터페이스 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">DropdownMenuItemDef 인터페이스</h2>
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
            <td>label</td>
            <td>string</td>
            <td>-</td>
            <td>메뉴 아이템 레이블 (필수)</td>
          </tr>
          <tr>
            <td>value</td>
            <td>string</td>
            <td>-</td>
            <td>고유 식별자 — @select 이벤트로 전달됨 (필수)</td>
          </tr>
          <tr>
            <td>icon</td>
            <td>string</td>
            <td>-</td>
            <td>아이콘 클래스명 (예: 'icon-view', 'icon-delete')</td>
          </tr>
          <tr>
            <td>color</td>
            <td>'default' | 'danger'</td>
            <td>'default'</td>
            <td>위험 액션(삭제 등)은 'danger' 지정</td>
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
            <td>#trigger</td>
            <td>드롭다운을 열기 위한 트리거 요소 (버튼 등)</td>
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
            <td>@select</td>
            <td>(value: string)</td>
            <td>메뉴 아이템 선택 시 발생 — 선택된 item.value 전달</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================

// 기본 메뉴 아이템
const basicItems: DropdownMenuItemDef[] = [
  { label: '보기', value: 'view', icon: 'icon-view' },
  { label: '수정', value: 'edit', icon: 'icon-edit' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' },
]

// 아이콘 메뉴
const iconItems: DropdownMenuItemDef[] = [
  { label: '보기', value: 'view', icon: 'icon-view' },
  { label: '수정', value: 'edit', icon: 'icon-edit' },
  { label: '복사', value: 'copy', icon: 'icon-copy-gray' },
  { label: '이동', value: 'transfer', icon: 'icon-transfer' },
]

// Danger 색상 메뉴
const dangerItems: DropdownMenuItemDef[] = [
  { label: '수정', value: 'edit', icon: 'icon-edit' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' },
]

// 선택된 값 추적
const selectedValue = ref('')

const onSelect = (value: string) => {
  selectedValue.value = value
}
</script>
