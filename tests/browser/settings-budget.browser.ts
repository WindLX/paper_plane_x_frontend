import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

for (const theme of ['light', 'dark']) {
  test(`total budget form saves without legacy/tokenizer settings (${theme})`, async ({ page }) => {
    await page.addInitScript((theme) => {
      localStorage.setItem('ppx-console-locale', 'en-US')
      localStorage.setItem('ppx-console-theme', theme)
    }, theme)
    const provider = {
      name: 'synthetic-provider',
      model: 'synthetic-model',
      has_api_key: false,
      base_url: 'https://synthetic.invalid/v1',
      context_window_tokens: 262144,
      max_output_tokens: 200000,
    }
    const agents = [
      'extraction',
      'analysis',
      'fact_check',
      'deep_diver',
      'query_builder',
      'global_finder',
    ].map((agent_name) => ({
      agent_name,
      provider_name: provider.name,
      temperature: 0.7,
      max_total_tokens: 240000,
      timeout: 180,
      thinking_enabled: false,
      reasoning_effort: null,
      extra_body: null,
      is_vlm: false,
      short_memory_window: 99999999,
      effective_model: provider.model,
      effective_base_url: provider.base_url,
    }))
    const writes: Record<string, unknown>[] = []
    await page.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api/v1', '')
      let body: unknown = {}
      if (path === '/projects') body = { items: [], total: 0 }
      else if (path === '/settings/providers') body = { items: [provider] }
      else if (path === '/settings/agent_llm') body = { items: agents }
      else if (path === '/settings')
        body = {
          providers: [provider],
          pdf_parser: {
            type: 'local_mineru',
            local: { base_url: 'https://synthetic.invalid', output_dir: '/synthetic' },
            cloud: {
              has_api_key: false,
              base_url: 'https://synthetic.invalid',
              model_version: 'pipeline',
              enable_formula: true,
              enable_table: true,
              is_ocr: false,
              language: 'ch',
            },
          },
          data_process: {
            worker_count: 5,
            max_retries: 3,
            shutdown_timeout: 5,
            task_max_seconds: 600,
          },
          librarian: { top_tags_limit: 8 },
          pandoc: { pandoc_path: null, html_template: null, pdf_engine: null },
        }
      else if (path === '/settings/agent_llm/global_finder') {
        const payload = route.request().postDataJSON()
        writes.push(payload)
        Object.assign(agents[5], payload)
        body = agents[5]
      } else if (path === '/settings/providers/synthetic-provider') {
        const payload = route.request().postDataJSON()
        writes.push(payload)
        Object.assign(provider, payload)
        body = provider
      }
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
    })
    await page.routeWebSocket('**/api/v1/**', (socket) => socket.close())
    await page.goto('/settings')
    const row = page.getByRole('row').filter({ hasText: 'global_finder' })
    await expect(row).toContainText('240000')
    await row.getByRole('button', { name: 'Edit', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Total tokens per request')
    await expect(dialog).not.toContainText('Tokenizer')
    const total = dialog.getByRole('spinbutton', { name: 'Total tokens per request' })
    await expect(total).toHaveValue('240000')
    await total.fill('220000')
    await dialog.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    expect(writes[0]).toMatchObject({ max_total_tokens: 220000 })
    expect(writes[0]).not.toHaveProperty('max_tokens')
    expect(writes[0]).not.toHaveProperty('tokenizer_model')
    await expect(row).toContainText('220000')
    await page
      .getByRole('row')
      .filter({ hasText: 'synthetic-model' })
      .first()
      .getByRole('button', { name: 'Edit', exact: true })
      .click()
    await dialog.getByText('Advanced: model token limits', { exact: true }).click()
    await expect(dialog).toContainText('Model context window')
    await expect(dialog).not.toContainText('Token counting model')
    await dialog.getByRole('spinbutton', { name: 'Model context window' }).fill('')
    await dialog.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    expect(writes[1]).toMatchObject({ context_window_tokens: null, max_output_tokens: 200000 })
    expect(writes[1]).not.toHaveProperty('tokenizer_model')
    // Check the budget modal at a narrow viewport as well.
    await page.setViewportSize({ width: 390, height: 844 })
    await row.getByRole('button', { name: 'Edit', exact: true }).click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('spinbutton', { name: 'Total tokens per request' })).toHaveValue(
      '220000',
    )
    await expect(dialog).toBeInViewport()
    await page.screenshot({
      path: test.info().outputPath('budget-narrow.png'),
    })
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.screenshot({
      path: test.info().outputPath('budget-desktop.png'),
    })
  })
}
