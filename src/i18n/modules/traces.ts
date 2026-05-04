export const traces = {
  'zh-CN': {
    title: 'Agent Trace',
    subtitle: '查看 Agent 调用 trace、模型交互与 token 消耗记录。',
    searchPlaceholder: '按 trace_id / agent_name / model 搜索',
    empty: '暂无 Trace',
    deleted: 'Trace {traceId} 已删除',
    cards: {
      total: '总数',
      agents: 'Agent 种类',
    },
    table: {
      traceId: 'Trace ID',
      agent: 'Agent',
      model: '模型',
      caller: '调用方',
      callerId: '调用方 ID',
      created: '创建时间',
      totalTokens: 'Token 用量',
    },
    detail: {
      messages: '消息列表',
      usage: '用量信息',
    },
  },
  'en-US': {
    title: 'Agent Trace',
    subtitle: 'Review agent traces, model interactions and token usage.',
    searchPlaceholder: 'Search by trace_id / agent_name / model',
    empty: 'No traces',
    deleted: 'Trace {traceId} deleted',
    cards: {
      total: 'Total',
      agents: 'Agent Types',
    },
    table: {
      traceId: 'Trace ID',
      agent: 'Agent',
      model: 'Model',
      caller: 'Caller',
      callerId: 'Caller ID',
      created: 'Created',
      totalTokens: 'Token Usage',
    },
    detail: {
      messages: 'Messages',
      usage: 'Usage',
    },
  },
} as const
