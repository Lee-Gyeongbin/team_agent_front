<template>
  <article
    class="my-doc-card"
    :class="{ 'is-active': isActive }"
    @click="emit('open', doc)"
  >
    <div
      class="my-doc-card-doc"
      :class="{ 'is-default': !docAreaStyle }"
      :style="docAreaStyle"
    >
      <i class="icon icon-document size-48" />
    </div>

    <div class="my-doc-card-main">
      <div class="my-doc-card-head">
        <h3 class="my-doc-card-title">{{ doc.docNm }}</h3>
        <div @click.stop>
          <UiDropdownMenu
            :items="menuItems"
            align="end"
            @select="emit('menuSelect', doc, $event)"
          >
            <template #trigger>
              <UiButton
                icon-only
                variant="ghost"
                size="md"
              >
                <template #icon-left>
                  <i class="icon icon-add-dot size-20" />
                </template>
              </UiButton>
            </template>
          </UiDropdownMenu>
        </div>
      </div>

      <div class="my-doc-card-footer">
        <span
          v-if="doc.newYn === 'Y'"
          class="my-doc-card-new-tag"
          >NEW</span
        >
        <p class="my-doc-card-date">
          {{ formatDateTimeDisplay(doc.modifyDt || doc.createDt) }}
        </p>
        <span
          class="my-doc-card-agent-wrap"
          @click.stop
        >
          <UiTooltip
            :content="agentLabel"
            side="top"
            align="end"
            :side-offset="8"
            content-class="my-doc-agent-tooltip"
          >
            <span class="my-doc-card-agent">
              <i :class="['icon', agentIconClass, 'size-14']" />
            </span>
          </UiTooltip>
        </span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { MyDoc } from '~/types/mydoc'
import {
  getMyDocAgentIconClass,
  getMyDocAgentLabel,
  getMyDocDocAreaStyle,
  getMyDocMenuItems,
} from '~/utils/myDocuments/myDocDisplayUtil'
import { formatDateTimeDisplay } from '~/utils/global/dateUtil'

interface Props {
  doc: MyDoc
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
})

const emit = defineEmits<{
  open: [doc: MyDoc]
  menuSelect: [doc: MyDoc, action: string]
}>()

const docAreaStyle = computed(() => getMyDocDocAreaStyle(props.doc))
const agentLabel = computed(() => getMyDocAgentLabel(props.doc))
const agentIconClass = computed(() => getMyDocAgentIconClass(props.doc))
const menuItems = computed(() => getMyDocMenuItems())
</script>
