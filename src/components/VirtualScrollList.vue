<script setup lang="ts" generic="T">
import { computed, ref } from 'vue'

const emit = defineEmits<{
  scroll: [event: Event]
  'reach-top': []
  'reach-bottom': []
}>()

const props = withDefaults(
  defineProps<{
    items: T[]
    /** How many items to render at once */
    windowSize?: number
    /** Items to add/remove per edge trigger */
    stepSize?: number
    /** px from edge to trigger loading more */
    scrollThreshold?: number
    /** Field name to use as v-for key; falls back to index */
    keyField?: string
  }>(),
  {
    windowSize: 15,
    stepSize: 5,
    scrollThreshold: 200,
    keyField: undefined,
  },
)

const scrollEl = ref<HTMLElement | null>(null)
const windowStart = ref(0)

const visibleItems = computed(() => {
  const start = Math.max(0, windowStart.value)
  const end = Math.min(props.items.length, start + props.windowSize)
  return props.items.slice(start, end)
})

const offsetTop = computed(() => windowStart.value)
const offsetBottom = computed(() =>
  Math.max(0, props.items.length - windowStart.value - props.windowSize),
)

function onScroll(): void {
  const el = scrollEl.value
  if (!el) return
  emit('scroll', new Event('scroll'))
  const nearTop = el.scrollTop < props.scrollThreshold
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < props.scrollThreshold

  if (nearTop && windowStart.value > 0) {
    windowStart.value = Math.max(0, windowStart.value - props.stepSize)
    emit('reach-top')
  } else if (nearBottom && windowStart.value + props.windowSize < props.items.length) {
    windowStart.value = Math.min(
      props.items.length - props.windowSize,
      windowStart.value + props.stepSize,
    )
    emit('reach-bottom')
  } else if (nearBottom) {
    emit('reach-bottom')
  }
}

function getKey(item: T, index: number): string | number {
  if (props.keyField && typeof item === 'object' && item !== null) {
    const obj = item as Record<string, unknown>
    // Try _key first (for FlatEntry-style objects)
    if (typeof obj._key === 'string') return obj._key
    // Then try the named field
    const v = obj[props.keyField]
    if (typeof v === 'string' || typeof v === 'number') return v
  }
  return index
}

defineExpose({ scrollEl, windowStart })
</script>

<template>
  <div ref="scrollEl" class="overflow-y-auto" @scroll="onScroll">
    <div v-if="offsetTop > 0" class="text-ppx-text-muted py-2 text-center text-xs">
      <slot name="above" :count="offsetTop" />
    </div>
    <div v-for="(item, idx) in visibleItems" :key="getKey(item, windowStart + idx)">
      <slot :item="item" :index="windowStart + idx" />
    </div>
    <div v-if="offsetBottom > 0" class="text-ppx-text-muted py-2 text-center text-xs">
      <slot name="below" :count="offsetBottom" />
    </div>
  </div>
</template>
