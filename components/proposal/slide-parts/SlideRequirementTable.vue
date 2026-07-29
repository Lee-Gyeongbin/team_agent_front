<template>
  <table class="slide-req-table">
    <thead>
      <tr>
        <th>요구사항</th>
        <th>요구내용</th>
        <th>대응방안</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(row, idx) in content?.rows"
        :key="idx"
      >
        <td class="slide-req-no">{{ row.reqNo }}</td>
        <td>{{ row.reqContent }}</td>
        <td>{{ row.response }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type { RequirementTableContent } from '~/types/proposal'
defineProps<{ content: RequirementTableContent }>()
</script>

<style lang="scss" scoped>
.slide-req-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.slide-req-table th {
  background: var(--slide-base-color, #5b4fe9);
  color: #fff;
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
}

.slide-req-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #e5e7eb;
}

.slide-req-no {
  font-weight: 600;
  white-space: nowrap;
}
</style>
