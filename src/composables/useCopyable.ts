import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { useNotify } from './useNotify'

export function useCopyable() {
  const copied = ref(false)
  let timer: number | null = null

  const { t } = useI18n()
  const notify = useNotify()

  function legacyCopy(text: string): boolean {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    let ok
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    document.body.removeChild(textarea)
    return ok
  }

  async function copyToClipboard(text: string): Promise<void> {
    try {
      // navigator.clipboard is only available in secure contexts (HTTPS/localhost);
      // fall back to execCommand('copy') when serving over plain HTTP.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else if (!legacyCopy(text)) {
        throw new Error('legacy copy failed')
      }
      copied.value = true
      if (timer !== null) {
        window.clearTimeout(timer)
      }
      timer = window.setTimeout(() => {
        copied.value = false
        timer = null
      }, 1200)
    } catch {
      notify.push(t('copyable.copyFailed'), 'warning')
    }
    notify.push(t('copyable.copied'), 'success', 1200)
  }

  return reactive({
    copied,
    copyToClipboard,
  })
}
