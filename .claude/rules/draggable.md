# 드래그앤드롭 (vuedraggable)

## 라이브러리

- `vuedraggable@next` (v4.x, Sortable.js 기반)
- 리스트/그리드 정렬, 그룹 간 이동, 칸반 보드 등 **정렬 관련 드래그는 전부 이걸로**
- 파일 업로드 드래그만 네이티브 `@dragover`/`@drop` 별도 처리

## 기본 사용법

```vue
<template>
  <draggable v-model="list" item-key="id" animation="200" @end="onDragEnd">
    <template #item="{ element }">
      <div>{{ element.name }}</div>
    </template>
  </draggable>
</template>

<script setup>
import draggable from 'vuedraggable'

const list = ref([
  { id: '1', name: '항목 1' },
  { id: '2', name: '항목 2' },
])

const onDragEnd = () => {
  const orderData = list.value.map((item, i) => ({ id: item.id, order: i }))
  console.warn('[TODO] 순서 변경:', orderData)
  // 🔽 백엔드 연결 시 fetchSaveOrder(orderData) 로 교체
}
</script>
```

## 필수 규칙

- `v-model` 데이터는 **객체 배열** (숫자/문자열 배열 X)
- `item-key`는 객체의 **고유 ID 필드**
- `animation="200"` 권장
- `@end`에서 순서 저장 API 호출 (현재는 console.warn)

## 주요 Props

| Prop | 설명 | 예시 |
|------|------|------|
| `v-model` | 정렬 대상 배열 | `v-model="list"` |
| `item-key` | 고유 키 필드 | `item-key="id"` |
| `handle` | 드래그 핸들 선택자 | `handle=".drag-handle"` |
| `group` | 그룹 간 이동 | `:group="{ name: 'cards' }"` |
| `delay` | 드래그 시작 지연 (ms) | `:delay="0"` |
| `delay-on-touch-only` | 터치에서만 지연 | `:delay-on-touch-only="true"` |
| `animation` | 정렬 애니메이션 (ms) | `animation="200"` |

## 프로젝트 적용 패턴

### 1. 핸들 드래그 (Agent 페이지)

특정 영역만 잡아서 드래그. 카드 클릭과 충돌 없음.

```vue
<draggable v-model="agentList" handle=".agent-card-drag" item-key="id" animation="200" @end="onDragEnd">
  <template #item="{ element }">
    <div class="agent-card">
      <div class="agent-card-drag"><i class="icon-move-handle size-20" /></div>
      <div>{{ element.name }}</div>
    </div>
  </template>
</draggable>
```

### 2. 그룹 간 이동 (Library 카드)

`group.name`이 같으면 서로 다른 리스트 간 이동 가능.

```vue
<draggable v-model="categoryCards[categoryId]" :group="{ name: 'library-cards' }" item-key="id">
```

### 3. 중첩 드래그 (Library 카테고리 + 카드)

외부: 카테고리 정렬 (헤더 핸들), 내부: 카드 정렬 (그룹 간 이동).

```vue
<!-- 카테고리 드래그 -->
<draggable v-model="categoryList" handle=".library-list-header" item-key="id" @end="onCategoryDragEnd">
  <template #item="{ element: category }">
    <div class="library-list-grp">
      <div class="library-list-header">{{ category.name }}</div>

      <!-- 카드 드래그 -->
      <draggable v-model="categoryCards[category.id]" :group="{ name: 'library-cards' }" item-key="id" @end="onCardDragEnd">
        <template #item="{ element: card }">
          <div class="library-card">{{ card.title }}</div>
        </template>
      </draggable>
    </div>
  </template>
</draggable>
```

## 스타일

```scss
// 드래그 중 고스트 (반투명)
.sortable-ghost {
  opacity: 0.4;
}

// 핸들 커서
.drag-handle {
  cursor: grab;
  &:active { cursor: grabbing; }
}
```

## DB 저장 (백엔드 연결 시)

```ts
// @end 이벤트에서 새 순서를 API로 전송
const onDragEnd = () => {
  const orderData = list.value.map((item, i) => ({ id: item.id, order: i }))
  fetchSaveOrder(orderData)  // POST /api/.../updateOrder.do
}

// 카테고리 간 이동 시 categoryId도 함께
const onCardDragEnd = () => {
  const allCards = categoryList.value.map((cat) => ({
    categoryId: cat.id,
    cards: categoryCards.value[cat.id].map((card, i) => ({ id: card.id, order: i })),
  }))
  fetchSaveCardOrder(allCards)
}
```
