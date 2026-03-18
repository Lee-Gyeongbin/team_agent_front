<template>
  <div class="guide-page">
    <h1 class="guide-title">UiToast</h1>
    <p class="guide-description">우측 상단 토스트 알림 — 타입별 색상, 다중 스택, 자동/수동 닫기 지원</p>

    <!-- ============================================ -->
    <!-- 타입별 데모 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">타입별 토스트</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <UiButton
              variant="primary"
              size="sm"
              @click="openToast({ message: '저장이 완료되었습니다.', type: 'success' })"
            >
              Success
            </UiButton>
            <UiButton
              variant="danger"
              size="sm"
              @click="openToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' })"
            >
              Error
            </UiButton>
            <UiButton
              variant="warning"
              size="sm"
              @click="openToast({ message: '저장하지 않은 변경사항이 있습니다.', type: 'warning' })"
            >
              Warning
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              @click="openToast({ message: '클립보드에 복사되었습니다.', type: 'info' })"
            >
              Info
            </UiButton>
          </div>
        </div>
        <pre class="demo-code">openToast({ message: '저장이 완료되었습니다.', type: 'success' })
openToast({ message: '삭제에 실패했습니다.', type: 'error' })
openToast({ message: '저장하지 않은 변경사항이 있습니다.', type: 'warning' })
openToast({ message: '클립보드에 복사되었습니다.', type: 'info' })</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 문자열 단축 호출 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">문자열 단축 호출</h2>
      <div class="guide-demo">
        <p class="demo-label">문자열만 넘기면 type: 'info'로 동작</p>
        <div class="demo-box">
          <UiButton
            variant="outline"
            size="sm"
            @click="openToast('간단한 알림 메시지입니다.')"
          >
            문자열 호출
          </UiButton>
        </div>
        <pre class="demo-code">openToast('간단한 알림 메시지입니다.')</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 다중 스택 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">다중 스택</h2>
      <div class="guide-demo">
        <p class="demo-label">여러 번 호출하면 위에서 아래로 쌓임</p>
        <div class="demo-box">
          <UiButton
            variant="outline"
            size="sm"
            @click="onMultiToast"
          >
            3개 연속 호출
          </UiButton>
        </div>
        <pre class="demo-code">openToast({ message: '첫 번째 알림', type: 'info' })
openToast({ message: '두 번째 알림', type: 'success' })
openToast({ message: '세 번째 알림', type: 'warning' })</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- duration 커스텀 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">duration 커스텀</h2>
      <div class="guide-demo">
        <div class="demo-box">
          <div style="display: flex; gap: 8px">
            <UiButton
              variant="outline"
              size="sm"
              @click="openToast({ message: '1초 후 사라집니다.', type: 'info', duration: 1000 })"
            >
              1초
            </UiButton>
            <UiButton
              variant="outline"
              size="sm"
              @click="openToast({ message: '5초 후 사라집니다.', type: 'success', duration: 5000 })"
            >
              5초
            </UiButton>
          </div>
        </div>
        <pre class="demo-code">openToast({ message: '1초 후 사라집니다.', type: 'info', duration: 1000 })
openToast({ message: '5초 후 사라집니다.', type: 'success', duration: 5000 })</pre>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- API -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">API</h2>

      <h3 class="section-subtitle">openToast(options)</h3>
      <table class="guide-status-table">
        <thead>
          <tr>
            <th>옵션</th>
            <th>Type</th>
            <th>Default</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>message</td>
            <td>string</td>
            <td>-</td>
            <td>표시할 메시지 (필수)</td>
          </tr>
          <tr>
            <td>type</td>
            <td>'success' | 'error' | 'warning' | 'info'</td>
            <td>'info'</td>
            <td>토스트 타입 (색상/아이콘 결정)</td>
          </tr>
          <tr>
            <td>duration</td>
            <td>number</td>
            <td>2500</td>
            <td>자동 닫힘 시간 (ms)</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ============================================ -->
    <!-- 사용법 -->
    <!-- ============================================ -->
    <section class="guide-section">
      <h2 class="section-title">사용법</h2>
      <div class="guide-demo">
        <pre class="demo-code">// Nuxt auto-import — import 없이 바로 사용
openToast('간단한 메시지')
openToast({ message: '저장 완료', type: 'success' })
openToast({ message: '에러 발생', type: 'error', duration: 5000 })

// app.vue에 &lt;UiToast /&gt; 이미 등록됨 — 추가 설정 불필요</pre>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const onMultiToast = () => {
  openToast({ message: '첫 번째 알림', type: 'info' })
  setTimeout(() => openToast({ message: '두 번째 알림', type: 'success' }), 300)
  setTimeout(() => openToast({ message: '세 번째 알림', type: 'warning' }), 600)
}
</script>
