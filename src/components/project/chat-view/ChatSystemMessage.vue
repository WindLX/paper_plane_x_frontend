<script setup lang="ts">
import type { ConversationMessageResponse } from '@/types/api'

defineProps<{
  msg: ConversationMessageResponse
}>()
</script>

<template>
  <div class="flex justify-center px-4 py-2">
    <div class="bg-ppx-bg-elevated max-w-[80%] rounded-xl px-3 py-1.5 text-xs">
      {{ msg.content ?? '' }}
    </div>
  </div>
</template>
