import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import AgentConfigsSection from './AgentConfigsSection.vue'
import { messages } from '@/i18n/messages'
import type { AgentLLMConfig } from '@/types/api'

const agent: AgentLLMConfig = {
  agent_name: 'global_finder',
  provider_name: 'synthetic',
  temperature: 0.7,
  max_total_tokens: 240000,
  timeout: 180,
  thinking_enabled: true,
  is_vlm: false,
  short_memory_window: 99999999,
}

describe('Agent token budget settings', () => {
  it.each(['zh-CN', 'en-US'])(
    'shows total budget rather than an output cap (%s)',
    async (locale) => {
      const app = createSSRApp({ render: () => h(AgentConfigsSection, { agents: [agent] }) })
      app.use(createI18n({ legacy: false, locale, messages }))
      const html = await renderToString(app)
      expect(html).toContain('240000')
      expect(html).toContain(
        locale === 'zh-CN' ? '单次请求总 Token 预算' : 'Total tokens per request',
      )
      expect(html).not.toContain('max_tokens')
    },
  )
})
