import { ref } from 'vue'

export type NotifyType = 'info' | 'success' | 'error' | 'warning'

export type NotifyItem = {
  id: number
  type: NotifyType
  message: string
  durationMs: number
}

const items = ref<NotifyItem[]>([])
let seed = 1

export function useNotify() {
  function push(
    message: string,
    type: NotifyType = 'info',
    durationMs = 2600,
  ): void {
    const id = seed++
    items.value.push({ id, type, message, durationMs })
    window.setTimeout(() => {
      remove(id)
    }, durationMs)
  }

  function remove(id: number): void {
    items.value = items.value.filter((item) => item.id !== id)
  }

  return {
    items,
    push,
    remove,
  }
}
