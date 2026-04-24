import { reactive } from 'vue'

type DialogTone = 'default' | 'danger'

type DialogState = {
  open: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  tone: DialogTone
}

const state = reactive<DialogState>({
  open: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  tone: 'default',
})

let resolver: ((value: boolean) => void) | null = null

export function useDialog() {
  function confirm(options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    tone?: DialogTone
  }): Promise<boolean> {
    state.open = true
    state.title = options.title
    state.message = options.message
    state.confirmText = options.confirmText ?? 'Confirm'
    state.cancelText = options.cancelText ?? 'Cancel'
    state.tone = options.tone ?? 'default'
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  function resolveDialog(result: boolean): void {
    state.open = false
    if (resolver) {
      resolver(result)
      resolver = null
    }
  }

  return {
    state,
    confirm,
    resolveDialog,
  }
}
