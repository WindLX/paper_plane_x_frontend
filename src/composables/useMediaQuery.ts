import { onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'

export function useMediaQuery(query: string) {
  const matches = ref(false)
  let mediaQueryList: MediaQueryList | null = null
  let handleChange: ((event: MediaQueryListEvent) => void) | null = null

  function updateMatch(nextValue: boolean): void {
    matches.value = nextValue
  }

  onMounted(() => {
    mediaQueryList = window.matchMedia(query)
    updateMatch(mediaQueryList.matches)
    handleChange = (event) => {
      updateMatch(event.matches)
    }
    mediaQueryList.addEventListener('change', handleChange)
  })

  onBeforeUnmount(() => {
    if (mediaQueryList && handleChange) {
      mediaQueryList.removeEventListener('change', handleChange)
    }
  })

  watchEffect(() => {
    if (typeof window === 'undefined') {
      matches.value = false
    }
  })

  return matches
}
