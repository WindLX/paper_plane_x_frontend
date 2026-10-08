import { reactive } from 'vue'

import { translate } from '../i18n'

type DialogTone = 'default' | 'danger'

type DialogState = {
  open: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  secondaryText: string
  tone: DialogTone
}

const state = reactive<DialogState>({
  open: false,
  title: '',
  message: '',
  confirmText: translate('dialog.confirm'),
  cancelText: translate('dialog.cancel'),
  secondaryText: '',
  tone: 'default',
})

export type DialogResult = 'confirm' | 'secondary' | 'cancel'
let resolver: ((value: DialogResult) => void) | null = null

export function useDialog() {
  function confirm(options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    tone?: DialogTone
  }): Promise<boolean> {
    return choose(options).then((result) => result === 'confirm')
  }

  function choose(options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    secondaryText?: string
    tone?: DialogTone
  }): Promise<DialogResult> {
    // A newly requested dialog cancels the previous one instead of stranding its caller.
    resolver?.('cancel')
    resolver = null
    state.open = true
    state.title = options.title
    state.message = options.message
    state.confirmText = options.confirmText ?? translate('dialog.confirm')
    state.cancelText = options.cancelText ?? translate('dialog.cancel')
    state.secondaryText = options.secondaryText ?? ''
    state.tone = options.tone ?? 'default'
    return new Promise<DialogResult>((resolve) => {
      resolver = resolve
    })
  }

  function resolveDialog(result: boolean | DialogResult): void {
    state.open = false
    if (resolver) {
      resolver(typeof result === 'boolean' ? (result ? 'confirm' : 'cancel') : result)
      resolver = null
    }
  }

  return {
    state,
    confirm,
    choose,
    resolveDialog,
  }
}
