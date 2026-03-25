<template>
  <div class="guide-page">
    <h1 class="guide-title">UiFileUpload</h1>
    <p class="guide-description">파일 업로드 컴포넌트 — 드래그앤드롭, 클릭 선택, 다중 파일, 파일 목록 관리</p>

    <!-- 기본 사용 -->
    <section class="guide-section">
      <h2 class="section-title">기본 사용</h2>
      <div class="guide-demo">
        <div style="max-width: 500px">
          <UiFileUpload v-model="files1" />
        </div>
      </div>
      <p class="guide-note">선택된 파일: {{ files1.length }}개</p>
      <pre class="guide-code"><code>&lt;UiFileUpload v-model="files" /&gt;</code></pre>
    </section>

    <!-- 이미지 전용 -->
    <section class="guide-section">
      <h2 class="section-title">이미지 전용</h2>
      <div class="guide-demo">
        <div style="max-width: 500px">
          <UiFileUpload
            v-model="files2"
            accept=".png,.jpg,.jpeg,.gif,.webp"
            hint="PNG, JPG, GIF, WEBP (최대 10MB)"
          />
        </div>
      </div>
      <pre class="guide-code"><code>&lt;UiFileUpload
  v-model="files"
  accept=".png,.jpg,.jpeg,.gif,.webp"
  hint="PNG, JPG, GIF, WEBP (최대 10MB)"
/&gt;</code></pre>
    </section>

    <!-- 단일 파일 -->
    <section class="guide-section">
      <h2 class="section-title">단일 파일</h2>
      <div class="guide-demo">
        <div style="max-width: 500px">
          <UiFileUpload
            v-model="files3"
            :multiple="false"
            hint="파일 1개만 선택 가능"
          />
        </div>
      </div>
      <pre class="guide-code"><code>&lt;UiFileUpload
  v-model="files"
  :multiple="false"
  hint="파일 1개만 선택 가능"
/&gt;</code></pre>
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
            <td><code>modelValue</code></td>
            <td><code>File[]</code></td>
            <td>—</td>
            <td>v-model 바인딩 (필수)</td>
          </tr>
          <tr>
            <td><code>multiple</code></td>
            <td><code>boolean</code></td>
            <td><code>true</code></td>
            <td>다중 파일 선택 허용</td>
          </tr>
          <tr>
            <td><code>accept</code></td>
            <td><code>string</code></td>
            <td><code>.pdf,.doc,...</code></td>
            <td>허용 파일 확장자</td>
          </tr>
          <tr>
            <td><code>hint</code></td>
            <td><code>string</code></td>
            <td>PDF, DOC, ... (최대 50MB)</td>
            <td>드롭존 하단 안내 텍스트</td>
          </tr>
          <tr>
            <td><code>maxSize</code></td>
            <td><code>number</code></td>
            <td><code>52428800</code> (50MB)</td>
            <td>파일당 최대 크기 (바이트)</td>
          </tr>
          <tr>
            <td><code>maxFiles</code></td>
            <td><code>number</code></td>
            <td>—</td>
            <td>첨부 가능한 최대 파일 개수 (미설정 시 제한 없음, <code>multiple</code>이 true일 때만 적용)</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const files1 = ref<File[]>([])
const files2 = ref<File[]>([])
const files3 = ref<File[]>([])
</script>
