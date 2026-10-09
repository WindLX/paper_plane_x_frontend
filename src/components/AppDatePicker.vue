<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import { parseDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date'
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  CalendarRoot,
  CalendarHeader,
  CalendarPrev,
  CalendarNext,
  CalendarGrid,
  CalendarGridHead,
  CalendarGridBody,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarCell,
  CalendarCellTrigger,
} from 'reka-ui'

import AppSelect from '@/components/AppSelect.vue'

defineProps<{ label: string }>()
const model = defineModel<string>({ default: '' })
const { t, locale } = useI18n()
const open = ref(false)
const placeholder = shallowRef<DateValue>(today(getLocalTimeZone()))
const monthNumber = computed({
  get: () => placeholder.value.month,
  set: (value: number) => {
    placeholder.value = placeholder.value.set({ month: value })
  },
})
const months = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Intl.DateTimeFormat(locale.value, { month: 'long' }).format(new Date(2020, i, 1)),
  })),
)
function changeYear(event: Event): void {
  const input = event.target
  if (!(input instanceof HTMLInputElement) || !input.reportValidity()) return
  placeholder.value = placeholder.value.set({ year: input.valueAsNumber })
}
const value = computed(() => (model.value ? parseDate(model.value) : undefined))
watch(value, (date) => {
  if (date) placeholder.value = date
})
const display = computed(() =>
  value.value
    ? new Intl.DateTimeFormat(locale.value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(value.value.toDate(getLocalTimeZone()))
    : t('workbench.dates.choose'),
)
function select(date: DateValue | undefined): void {
  model.value = date?.toString() ?? ''
  open.value = false
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <div
      class="workspace-select focus-within:border-ppx-accent flex h-11 min-w-0 items-center gap-2 !px-3 !py-0"
    >
      <PopoverTrigger as-child>
        <button
          type="button"
          :aria-label="label"
          class="focus-visible:text-ppx-accent flex min-w-0 flex-1 cursor-pointer items-center gap-2 self-stretch text-left text-sm outline-none"
        >
          <CalendarDays class="text-ppx-text-muted h-4 w-4 shrink-0" />
          <span class="truncate" :class="model ? 'text-ppx-text' : 'text-ppx-text-muted'">{{
            display
          }}</span>
        </button>
      </PopoverTrigger>
      <button
        v-if="model"
        type="button"
        class="workspace-icon-button !h-6 !w-6 shrink-0"
        :aria-label="t('workbench.dates.clear', { label })"
        @click="model = ''"
      >
        <X class="h-3.5 w-3.5" />
      </button>
    </div>
    <PopoverPortal>
      <PopoverContent
        align="start"
        :side-offset="8"
        :collision-padding="12"
        class="workspace-panel shadow-ppx-raised z-70 w-76 max-w-[calc(100vw-24px)] p-3"
        :aria-label="label"
      >
        <CalendarRoot
          v-slot="{ grid, weekDays }"
          v-model:placeholder="placeholder"
          :model-value="value"
          :locale="locale"
          :week-starts-on="1"
          fixed-weeks
          @update:model-value="select"
        >
          <CalendarHeader class="mb-3 flex items-center justify-between gap-2">
            <CalendarPrev :aria-label="t('workbench.dates.previous')" class="workspace-icon-button"
              ><ChevronLeft class="h-4 w-4"
            /></CalendarPrev>
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <AppSelect
                v-model="monthNumber"
                size="sm"
                :options="months"
                :aria-label="t('workbench.dates.month')"
                class="!rounded-lg"
              />
              <input
                type="number"
                min="1"
                max="9999"
                required
                :value="placeholder.year"
                :aria-label="t('workbench.dates.year')"
                class="workspace-input !w-20 !rounded-lg !px-2 !py-1.5 text-sm"
                @change="changeYear"
                @keydown.enter="changeYear"
              />
            </div>
            <CalendarNext :aria-label="t('workbench.dates.next')" class="workspace-icon-button"
              ><ChevronRight class="h-4 w-4"
            /></CalendarNext>
          </CalendarHeader>
          <CalendarGrid
            v-for="month in grid"
            :key="month.value.toString()"
            class="w-full border-collapse"
          >
            <CalendarGridHead>
              <CalendarGridRow>
                <CalendarHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="text-ppx-text-muted h-8 text-center text-xs font-medium"
                  >{{ day }}</CalendarHeadCell
                >
              </CalendarGridRow>
            </CalendarGridHead>
            <CalendarGridBody>
              <CalendarGridRow v-for="(week, index) in month.rows" :key="index">
                <CalendarCell
                  v-for="date in week"
                  :key="date.toString()"
                  :date="date"
                  class="p-0.5 text-center"
                >
                  <CalendarCellTrigger
                    :day="date"
                    :month="month.value"
                    class="text-ppx-text hover:bg-ppx-accent-soft focus-visible:ring-ppx-accent rounded-ppx-interactive data-[today]:text-ppx-accent data-[selected]:bg-ppx-accent data-[selected]:text-ppx-bg-elevated data-[outside-view]:text-ppx-text-muted mx-auto flex h-9 w-9 cursor-pointer items-center justify-center text-sm outline-none focus-visible:ring-2 data-[disabled]:opacity-40 data-[today]:font-bold"
                  />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarRoot>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
