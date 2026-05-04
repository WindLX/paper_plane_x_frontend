<script setup lang="ts">
import { Pencil, PlugZap } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import SettingsCard from '@/components/settings/SettingsCard.vue'
import type { AgentLLMConfig } from '@/types/api'

const props = defineProps<{
  agents: AgentLLMConfig[]
}>()

const emit = defineEmits<{
  edit: [agent: AgentLLMConfig]
}>()

const { t } = useI18n()
</script>

<template>
  <SettingsCard :title="t('settings.agents.title')" :icon="PlugZap">
    <div class="workspace-table-shell">
      <table class="workspace-table">
        <thead>
          <tr>
            <th>{{ t('settings.agents.name') }}</th>
            <th>{{ t('settings.agents.provider') }}</th>
            <th>{{ t('settings.agents.temperature') }}</th>
            <th>{{ t('settings.agents.maxTokens') }}</th>
            <th>{{ t('settings.agents.thinking') }}</th>
            <th>{{ t('settings.agents.isVlm') }}</th>
            <th>{{ t('settings.agents.extraBody') }}</th>
            <th>{{ t('settings.agents.effectiveConfig') }}</th>
            <th class="text-right">{{ t('settings.agents.edit') }}</th>
          </tr>
        </thead>
        <tbody class="animate-stagger">
          <tr
            v-for="agent in props.agents"
            :key="agent.agent_name"
            class="workspace-row-hover transition-colors"
          >
            <td class="text-ppx-text font-medium">{{ agent.agent_name }}</td>
            <td>{{ agent.provider_name }}</td>
            <td>
              {{ agent.temperature ?? t('settings.agents.noOverrides') }}
            </td>
            <td>
              {{ agent.max_tokens ?? t('settings.agents.noOverrides') }}
            </td>
            <td>
              <span
                class="workspace-badge"
                :class="
                  agent.thinking_enabled == null
                    ? 'workspace-badge--neutral'
                    : agent.thinking_enabled
                      ? 'workspace-badge--success'
                      : 'workspace-badge--neutral'
                "
              >
                {{
                  agent.thinking_enabled == null
                    ? t('settings.agents.noOverrides')
                    : agent.thinking_enabled
                      ? t('settings.yes')
                      : t('settings.no')
                }}
              </span>
            </td>
            <td>
              <span
                class="workspace-badge"
                :class="
                  agent.is_vlm == null
                    ? 'workspace-badge--neutral'
                    : agent.is_vlm
                      ? 'workspace-badge--info'
                      : 'workspace-badge--neutral'
                "
              >
                {{
                  agent.is_vlm == null
                    ? t('settings.agents.noOverrides')
                    : agent.is_vlm
                      ? t('settings.yes')
                      : t('settings.no')
                }}
              </span>
            </td>
            <td>
              <span
                v-if="agent.extra_body && Object.keys(agent.extra_body).length > 0"
                class="workspace-badge workspace-badge--info"
                :title="JSON.stringify(agent.extra_body)"
              >
                {{ Object.keys(agent.extra_body).length }} key(s)
              </span>
              <span v-else class="workspace-badge workspace-badge--neutral">
                {{ t('settings.agents.noOverrides') }}
              </span>
            </td>
            <td>
              <div class="text-sm">{{ agent.effective_model }}</div>
              <div class="text-ppx-text-muted text-xs">
                {{ agent.effective_base_url || '-' }}
              </div>
            </td>
            <td class="text-right">
              <AppButton size="xs" variant="outline" @click="emit('edit', agent)">
                <Pencil class="h-3.5 w-3.5" />
              </AppButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </SettingsCard>
</template>
