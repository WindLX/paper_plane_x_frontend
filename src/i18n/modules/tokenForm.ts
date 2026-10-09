/**
 * Token budget wording for the Agent settings form. The Agent table keeps the
 * existing `settings.agents.maxTotalTokens` copy ('单次请求总 Token 预算'), while
 * the form uses the shorter label below to keep numeric fields aligned.
 *
 * This module is intentionally not wired into `i18n/messages.ts` here; the
 * coordinating change registers it at the root as `tokenForm` so the key
 * resolves as `t('tokenForm.maxTotalTokens')`.
 */
export const tokenForm = {
  'zh-CN': {
    maxTotalTokens: '单次总 Token 预算',
  },
  'en-US': {
    maxTotalTokens: 'Total token budget per request',
  },
} as const
