<template>
  <DropdownMenuRoot v-model:open="openState">
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <!-- title 있으면 Radix Label로 상단 안내 문구만 표시(클릭 불가, 스크린리더용 구역 라벨 역할) -->
      <DropdownMenuContent
        class="ui-dropdown-content"
        :class="{ 'ui-dropdown-content--titled': Boolean(title) }"
        :side="side"
        :side-offset="sideOffset"
        :align="align"
        :collision-padding="collisionPadding"
      >
        <DropdownMenuLabel
          v-if="title"
          class="ui-dropdown-title"
        >
          {{ title }}
        </DropdownMenuLabel>
        <DropdownMenuItem
          v-for="item in items"
          :key="item.value"
          class="dropdown-item"
          :class="{ 'type-danger': item.color === 'danger' }"
          @select="emit('select', item.value)"
        >
          <i
            v-if="item.icon"
            :class="['icon', item.icon, 'size-16']"
          />
          <span>{{ item.label }}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'radix-vue'
export interface DropdownMenuItemDef {
  /** 메뉴 아이템 레이블 */
  label: string
  /** 아이콘 클래스명 (예: 'icon-view', 'icon-delete') */
  icon?: string
  /** 고유 식별자 (필수) — @select 이벤트로 부모에 전달됨 */
  value: string
  /** 위험 액션(삭제 등)은 'danger' 지정 → type-danger 클래스 적용 */
  color?: 'default' | 'danger'
}

interface Props {
  items: DropdownMenuItemDef[]
  /** 상단 비클릭 라벨(타이틀) — 예: 카테고리 선택 */
  title?: string
  /** 제어 모드: 열림 상태 (v-model:open 사용 시) */
  open?: boolean
  /** 메뉴가 열리는 방향 */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** 트리거 기준 정렬 */
  align?: 'start' | 'center' | 'end'
  /** 트리거와 메뉴 사이 간격 (px) */
  sideOffset?: number
  /** 뷰포트 경계와의 최소 여백 — flip 기준 (px) */
  collisionPadding?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  side: 'bottom',
  align: 'end',
  sideOffset: 5,
  collisionPadding: 8,
})

const emit = defineEmits<{
  select: [value: string]
  'update:open': [value: boolean]
}>()

const openState = ref(props.open ?? false)
watch(
  () => props.open,
  (v: boolean | undefined) => {
    if (v !== undefined) openState.value = v
  },
  { immediate: true },
)
watch(openState, (v: boolean) => emit('update:open', v))
</script>

<!--
  Portal로 body에 렌더링되므로 scoped 스타일 미적용.
  .dropdown-item은 _button.scss 전역 스타일 재사용.
  .ui-dropdown-content는 아래 전역 블록에서 별도 정의.
-->
<style lang="scss">
/* Portal 콘텐츠 스타일 — 전역 블록 필수 */
.ui-dropdown-content {
  min-width: 131px;
  padding: 4px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid rgba(45, 49, 57, 0.2);
  box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.1);
  z-index: $z-dropdown;

  /* Radix data-state 기반 진입/퇴장 애니메이션 */
  &[data-state='open'] {
    animation: ui-dropdown-in 0.15s ease;
  }

  &[data-state='closed'] {
    animation: ui-dropdown-out 0.1s ease forwards;
  }
}

/* DropdownMenuLabel — 메뉴 항목과 구분되는 보조 타이틀 스타일 */
.ui-dropdown-title {
  padding: 6px 8px 4px;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.3;
  color: #8b95a8;
  cursor: default;
  user-select: none;
}

@keyframes ui-dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ui-dropdown-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-4px);
  }
}

/*
  트리거 버튼 활성 상태:
  Radix가 as-child 버튼에 data-state="open" 주입 → 기존 .is-show 동작 대체
*/
.btn-library-card-add.type-white[data-state='open'] {
  background: #fff;
}
</style>
