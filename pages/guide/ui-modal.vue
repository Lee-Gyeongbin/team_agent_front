<template>
  <div class="guide-page">
    <NuxtLink
      to="/guide"
      class="guide-back"
    >← 가이드 목록</NuxtLink>
    <h1 class="guide-title">UiModal</h1>
    <p class="guide-description">center(중앙) / right(사이드) 모달 공통 컴포넌트 — 오버레이, 닫기 버튼, 슬롯 지원</p>

    <!-- 중앙 모달 (기본) -->
    <section class="guide-section">
      <h2 class="section-title">1. 중앙 모달 (position="center")</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiButton
            variant="outline"
            size="md"
            @click="isCenterOpen = true"
          >
            중앙 모달 열기
          </UiButton>
        </div>
        <pre class="demo-code">&lt;UiModal
  :is-open="isOpen"
  title="알림"
  position="center"
  @close="isOpen = false"
&gt;
  &lt;p&gt;모달 본문 내용&lt;/p&gt;

  &lt;template #footer&gt;
    &lt;div class="modal-dialog-footer"&gt;
      &lt;UiButton variant="dark" size="xlg" @click="isOpen = false"&gt;확인&lt;/UiButton&gt;
    &lt;/div&gt;
  &lt;/template&gt;
&lt;/UiModal&gt;</pre>
      </div>

      <UiModal
        :is-open="isCenterOpen"
        title="알림"
        position="center"
        @close="isCenterOpen = false"
      >
        <p>중앙 모달 본문 내용입니다.</p>

        <template #footer>
          <div class="modal-dialog-footer">
            <UiButton
              class="btn-modal-dialog"
              variant="outline"
              size="xlg"
              @click="isCenterOpen = false"
            >
              취소
            </UiButton>
            <UiButton
              class="btn-modal-dialog"
              variant="dark"
              size="xlg"
              @click="isCenterOpen = false"
            >
              확인
            </UiButton>
          </div>
        </template>
      </UiModal>
    </section>

    <!-- 사이드 모달 (right) -->
    <section class="guide-section">
      <h2 class="section-title">2. 사이드 모달 (position="right")</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiButton
            variant="outline"
            size="md"
            @click="isRightOpen = true"
          >
            사이드 모달 열기
          </UiButton>
        </div>
        <pre class="demo-code">&lt;UiModal
  :is-open="isOpen"
  title="사이드 패널"
  position="right"
  @close="isOpen = false"
&gt;
  &lt;p&gt;사이드 모달 본문 내용&lt;/p&gt;
&lt;/UiModal&gt;</pre>
      </div>

      <UiModal
        :is-open="isRightOpen"
        title="사이드 패널"
        position="right"
        @close="isRightOpen = false"
      >
        <div style="padding: 16px">
          <p>사이드 모달 본문 내용입니다.</p>
          <p style="margin-top: 12px; color: #64748b">오른쪽에서 슬라이드로 나타나는 모달입니다.</p>
        </div>
      </UiModal>
    </section>

    <!-- 커스텀 헤더 -->
    <section class="guide-section">
      <h2 class="section-title">3. 커스텀 헤더 (slot)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <UiButton
            variant="outline"
            size="md"
            @click="isCustomHeaderOpen = true"
          >
            커스텀 헤더 모달 열기
          </UiButton>
        </div>
        <pre class="demo-code">&lt;UiModal
  :is-open="isOpen"
  position="right"
  :show-close="false"
  @close="isOpen = false"
&gt;
  &lt;template #header&gt;
    &lt;div&gt;커스텀 헤더 영역&lt;/div&gt;
  &lt;/template&gt;
  &lt;p&gt;본문&lt;/p&gt;
&lt;/UiModal&gt;</pre>
      </div>

      <UiModal
        :is-open="isCustomHeaderOpen"
        position="right"
        :show-close="false"
        @close="isCustomHeaderOpen = false"
      >
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 24px 16px 16px">
            <h2 style="font-size: 20px; font-weight: 700; color: #2d3139">커스텀 헤더</h2>
            <button
              class="btn btn-modal-close"
              style="position: static"
              @click="isCustomHeaderOpen = false"
            >
              <i class="icon icon-close-gray size-20"></i>
            </button>
          </div>
        </template>

        <div style="padding: 16px">
          <p>header 슬롯을 사용하면 헤더를 자유롭게 커스터마이징할 수 있습니다.</p>
        </div>
      </UiModal>
    </section>

    <!-- maxWidth -->
    <section class="guide-section">
      <h2 class="section-title">4. maxWidth 지정</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="display: flex; gap: 12px">
            <UiButton
              variant="outline"
              size="md"
              @click="isWideOpen = true"
            >
              넓은 중앙 모달 (600px)
            </UiButton>
            <UiButton
              variant="outline"
              size="md"
              @click="isNarrowSideOpen = true"
            >
              좁은 사이드 모달 (400px)
            </UiButton>
          </div>
        </div>
        <pre class="demo-code">&lt;UiModal position="center" max-width="600px" /&gt;
&lt;UiModal position="right" max-width="400px" /&gt;</pre>
      </div>

      <UiModal
        :is-open="isWideOpen"
        title="넓은 모달"
        position="center"
        max-width="600px"
        @close="isWideOpen = false"
      >
        <p>max-width: 600px로 설정한 중앙 모달입니다.</p>

        <template #footer>
          <div class="modal-dialog-footer">
            <UiButton
              class="btn-modal-dialog"
              variant="dark"
              size="xlg"
              @click="isWideOpen = false"
            >
              확인
            </UiButton>
          </div>
        </template>
      </UiModal>

      <UiModal
        :is-open="isNarrowSideOpen"
        title="좁은 사이드"
        position="right"
        max-width="400px"
        @close="isNarrowSideOpen = false"
      >
        <div style="padding: 16px">
          <p>max-width: 400px로 설정한 사이드 모달입니다.</p>
        </div>
      </UiModal>
    </section>

    <!-- UiDialogModal / UiConfirmModal -->
    <section class="guide-section">
      <h2 class="section-title">5. UiDialogModal / UiConfirmModal (UiModal 기반)</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="display: flex; gap: 12px">
            <UiButton
              variant="outline"
              size="md"
              @click="isDialogOpen = true"
            >
              UiDialogModal (취소/확인)
            </UiButton>
            <UiButton
              variant="outline"
              size="md"
              @click="isConfirmOpen = true"
            >
              UiConfirmModal (확인만)
            </UiButton>
          </div>
        </div>
        <pre class="demo-code">&lt;UiDialogModal
  :is-open="isOpen"
  title="삭제 확인"
  message="정말 삭제하시겠습니까?"
  cancel-text="취소"
  confirm-text="삭제"
  @close="isOpen = false"
  @confirm="doDelete"
/&gt;

&lt;UiConfirmModal
  :is-open="isOpen"
  title="완료"
  message="저장되었습니다."
  @close="isOpen = false"
/&gt;</pre>
      </div>

      <UiDialogModal
        :is-open="isDialogOpen"
        title="삭제 확인"
        message="정말 삭제하시겠습니까?"
        cancel-text="취소"
        confirm-text="삭제"
        @close="isDialogOpen = false"
      />

      <UiConfirmModal
        :is-open="isConfirmOpen"
        title="완료"
        message="저장되었습니다."
        @close="isConfirmOpen = false"
      />
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
          <tr
            v-for="prop in propList"
            :key="prop.name"
          >
            <td><code>{{ prop.name }}</code></td>
            <td>{{ prop.type }}</td>
            <td><code>{{ prop.default }}</code></td>
            <td>{{ prop.desc }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Slots 정리 -->
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
          <tr
            v-for="slot in slotList"
            :key="slot.name"
          >
            <td><code>{{ slot.name }}</code></td>
            <td>{{ slot.desc }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Events 정리 -->
    <section class="guide-section">
      <h2 class="section-title">Events</h2>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>close</code></td>
            <td>오버레이 클릭 또는 닫기 버튼 클릭 시 발생</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
// 모달 상태
const isCenterOpen = ref(false)
const isRightOpen = ref(false)
const isCustomHeaderOpen = ref(false)
const isWideOpen = ref(false)
const isNarrowSideOpen = ref(false)
const isDialogOpen = ref(false)
const isConfirmOpen = ref(false)

// Props 테이블
const propList = [
  { name: 'isOpen', type: 'boolean', default: 'false', desc: '모달 열림/닫힘 상태' },
  { name: 'position', type: "'center' | 'right'", default: "'center'", desc: '모달 위치 (중앙 / 오른쪽 사이드)' },
  { name: 'title', type: 'string', default: "''", desc: '헤더 제목 (빈 값이면 헤더 미표시)' },
  { name: 'showOverlay', type: 'boolean', default: 'true', desc: '오버레이 배경 표시 여부' },
  { name: 'showClose', type: 'boolean', default: 'true', desc: '닫기 버튼 표시 여부' },
  { name: 'maxWidth', type: 'string', default: "''", desc: '컨텐츠 최대 너비 (예: 600px)' },
  { name: 'customClass', type: 'string', default: "''", desc: '루트 요소에 추가할 커스텀 클래스' },
]

// Slots 테이블
const slotList = [
  { name: 'header', desc: '헤더 영역 커스터마이징 (title prop 대신 사용)' },
  { name: 'default', desc: '본문 영역' },
  { name: 'footer', desc: '하단 버튼 영역' },
]
</script>
