import { reactive } from 'vue'

import { translate } from '../i18n'

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
  confirmText: translate('dialog.confirm'),
  cancelText: translate('dialog.cancel'),
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
    state.confirmText = options.confirmText ?? translate('dialog.confirm')
    state.cancelText = options.cancelText ?? translate('dialog.cancel')
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
