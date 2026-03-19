<template>
  <div class="guide-page">
    <h1 class="guide-title">UiTag</h1>
    <p class="guide-description">태그/칩 컴포넌트 — variant, 닫기 버튼, 크기 지원</p>

    <!-- 데모 1: variant -->
    <div class="guide-demo">
      <p class="demo-label">Variant</p>
      <div class="demo-box">
        <div style="display: flex; gap: 8px; flex-wrap: wrap">
          <UiTag label="기본" />
          <UiTag
            label="Primary"
            variant="primary"
          />
          <UiTag
            label="Success"
            variant="success"
          />
          <UiTag
            label="Warning"
            variant="warning"
          />
          <UiTag
            label="Danger"
            variant="danger"
          />
          <UiTag
            label="Info"
            variant="info"
          />
        </div>
      </div>
      <pre class="demo-code">
&lt;UiTag label="기본" /&gt;
&lt;UiTag label="Primary" variant="primary" /&gt;
&lt;UiTag label="Danger" variant="danger" /&gt;</pre>
    </div>

    <!-- 데모 2: 닫기 버튼 -->
    <div class="guide-demo">
      <p class="demo-label">닫기 버튼 (closable)</p>
      <div class="demo-box">
        <div style="display: flex; gap: 8px; flex-wrap: wrap">
          <UiTag
            v-for="tag in tags"
            :key="tag"
            :label="tag"
            variant="primary"
            closable
            @close="onRemoveTag(tag)"
          />
          <span
            v-if="!tags.length"
            style="color: #94a3b8; font-size: 14px"
          >태그를 모두 제거했습니다</span>
        </div>
      </div>
      <pre class="demo-code">
&lt;UiTag
  v-for="tag in tags"
  :key="tag"
  :label="tag"
  variant="primary"
  closable
  @close="onRemove(tag)"
/&gt;</pre>
    </div>

    <!-- 데모 3: 크기 -->
    <div class="guide-demo">
      <p class="demo-label">크기 (size)</p>
      <div class="demo-box">
        <div style="display: flex; gap: 8px; align-items: center">
          <UiTag
            label="Small"
            variant="info"
            size="sm"
          />
          <UiTag
            label="Medium"
            variant="info"
            size="md"
          />
        </div>
      </div>
      <pre class="demo-code">
&lt;UiTag label="Small" size="sm" /&gt;
&lt;UiTag label="Medium" size="md" /&gt;</pre>
    </div>

    <!-- 데모 4: 슬롯 -->
    <div class="guide-demo">
      <p class="demo-label">슬롯 사용 (커스텀 콘텐츠)</p>
      <div class="demo-box">
        <div style="display: flex; gap: 8px; align-items: center">
          <UiTag variant="success">
            <i class="icon-sparkle size-12" />
            AI 생성
          </UiTag>
          <UiTag
            variant="warning"
            closable
          >
            <i class="icon-time size-12" />
            임시 저장
          </UiTag>
        </div>
      </div>
      <pre class="demo-code">
&lt;UiTag variant="success"&gt;
  &lt;i class="icon-sparkle size-12" /&gt; AI 생성
&lt;/UiTag&gt;</pre>
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
            <td>label</td>
            <td>string</td>
            <td>''</td>
            <td>태그 텍스트 (슬롯으로 대체 가능)</td>
          </tr>
          <tr>
            <td>variant</td>
            <td>'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'</td>
            <td>'default'</td>
            <td>색상 변형</td>
          </tr>
          <tr>
            <td>size</td>
            <td>'sm' | 'md'</td>
            <td>'sm'</td>
            <td>크기</td>
          </tr>
          <tr>
            <td>closable</td>
            <td>boolean</td>
            <td>false</td>
            <td>닫기 버튼 표시</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Events -->
    <div class="guide-demo">
      <p class="demo-label">Events</p>
      <table class="guide-props-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>@close</td>
            <td>닫기 버튼 클릭 시 (closable일 때만)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const tags = ref(['Vue 3', 'TypeScript', 'Nuxt', 'SCSS'])

const onRemoveTag = (tag: string) => {
  tags.value = tags.value.filter((t) => t !== tag)
}
</script>
