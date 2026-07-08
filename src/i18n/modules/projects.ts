export const projects = {
  'zh-CN': {
    // ── Project page top-level ──────────────────────────────────
    projectId: '项目 ID',
    created: '创建时间',
    updated: '更新时间',

    // ── Project overview panel ──────────────────────────────────
    overview: '项目概览',
    summaryTitle: 'AI 项目摘要',
    summaryPlaceholder: '后续接入项目总结 agent 后，这里会呈现项目级摘要与阶段判断。',
    agentSummaryLoading: 'Agent 正在生成项目摘要，请稍候……',
    agentSummaryUpdated: 'Agent Summary 已更新',
    agentSummaryDeleted: 'Agent Summary 已删除',

    // ── Project export panel ────────────────────────────────────
    export: '导出',
    exportPanelTitle: '导出项目',
    exportFieldsTitle: '导出字段',
    exporting: '导出中...',
    exportReady: '项目导出已准备完成',
    citations: '引用处理',
    keepCitations: '保留 citations',
    stripCitations: '仅保留 AI 结果（移除 citations）',
    selectAllFields: '全选',
    exportFields: {
      paper_id: 'paper_id',
      project_ids: 'project_ids',
      title: 'title',
      authors: 'authors',
      year: 'year',
      publication: 'publication',
      doi: 'doi',
      custom_meta: 'custom_meta',
      raw_pdf_path: 'raw_pdf_path',
      raw_pdf_sha256: 'raw_pdf_sha256',
      images_paths: 'images_paths',
      extraction_status: 'extraction_status',
      extraction_fact_check_status: 'extraction_fact_check_status',
      analysis_fact_check_status: 'analysis_fact_check_status',
      extraction_retry_count: 'extraction_retry_count',
      analysis_retry_count: 'analysis_retry_count',
      created_at: 'created_at',
      updated_at: 'updated_at',
      quick_scan: 'quick_scan',
      synthesis_data: 'synthesis_data',
      analysis_report: 'analysis_report',
      extraction_fact_check_result: 'extraction_fact_check_result',
      analysis_fact_check_result: 'analysis_fact_check_result',
    },
    includeSandboxFiles: '包含沙箱文件',

    // ── Project edit panel ──────────────────────────────────────
    edit: '编辑',
    editPanelTitle: '编辑项目',
    fields: {
      name: '项目名称',
      description: '项目描述',
    },

    // ── Project logs panel ──────────────────────────────────────
    logsPanelTitle: '操作日志',
    viewLogs: '查看日志',
    noOperationLogs: '还没有操作日志。',
    logTitle: '日志 #{index}',
    rawResponse: '原始日志',

    // ── Project delete ──────────────────────────────────────────
    delete: '删除',
    deleteTitle: '删除项目',
    deleteConfirmTitle: '删除项目',
    deleteConfirmHint: '请输入项目名称 "{name}" 以确认删除。此操作不可撤销。',
    deleteConfirmPapers: '该项目包含 {count} 篇论文，删除后这些论文的关联将被移除。',
    deleteConfirmInputLabel: '项目名称',
    deleteConfirmMismatch: '输入的项目名称不匹配。',
    deleteConfirmSimple: '删除项目 {projectId}？此操作不可撤销。',
    deleteConfirmWithPapers:
      '项目 {projectId} 包含 {paperCount} 篇论文。\n删除项目会解除该项目与这些论文的关联。\n是否继续？',
    projectDeleted: '项目已删除',
    projectUpdated: '项目已更新',

    // ── Project files ──────────────────────────────────────────
    projectFiles: '项目文件',
    createFile: '新建文件',
    createDir: '新建文件夹',
    dirName: '文件夹名称',
    dirNamePlaceholder: '如 notes',
    dirCreated: '文件夹 {name} 已创建',
    fileName: '文件名',
    fileNamePlaceholder: '如 notes/idea.md',
    fileContent: '内容',
    fileContentPlaceholder: '输入文件内容...',
    fileCreated: '文件 {name} 已创建',
    fileUpdated: '文件已更新',
    fileDeleted: '文件 {name} 已删除',
    fileExported: '文件已导出为 {format}',
    exportFile: '导出',
    confirmDeleteFile: '确定删除文件 "{name}" 吗？',
    confirmDeleteDir: '确定删除文件夹 "{name}" 及其所有内容吗？',
    dirDeleted: '文件夹 {name} 已删除',
    noFiles: '暂无文件',

    // -- Project papers ──────────────────────────────────────────
    papers: '文献',

    // ── Project drawer ─────────────────────────────────────────
    projectDrawer: {
      tabPapers: '文献',
      empty: '暂无可展示的详情内容。',
      paperLinkNotSupported: '此操作暂不支持',
    },

    // ── Actions (shared) ────────────────────────────────────────
    actions: {
      back: '返回',
      create: '创建',
      open: '打开',
      delete: '删除',
      close: '关闭',
      edit: '编辑',
      confirm: '确定',
      search: '搜索',
      cancel: '取消',
      retry: '重试',
      refresh: '刷新',
      copy: '复制',
      export: '导出',
      exporting: '导出中...',
      selectAll: '全选',
      clear: '清空',
      link: '关联',
      linkToProject: '关联到项目',
      unlink: '解除关联',
      save: '保存',
    },

    // ── Common ──────────────────────────────────────────────────
    common: {
      loading: '加载中...',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      total: '总计',
    },

    // ── Errors ──────────────────────────────────────────────────
    errors: {
      requestFailed: '请求失败，请稍后重试',
      listProjects: '获取项目列表失败',
      createProject: '创建项目失败',
      deleteProject: '删除项目失败',
    },

    // ── Count summary ──────────────────────────────────────────
    countSummary: '{count} 个项目',
    filterSummary: '筛选：{keyword}',
    searchLabel: '当前筛选',
    searchIdle: '未筛选',
    empty: '暂无项目',
    emptyTitle: '暂无项目',
    emptyHint: '创建第一个研究项目。',

    stats: {
      total: '总项目',
      active: '活跃项目',
      recent: '最近更新',
      showing: '当前结果',
    },
    statusCards: {
      total: '论文总数',
    },

    // ── Librarian global finder ─────────────────────────────────
    librarian: {
      globalFinder: {
        yearStats: '年份统计',
        mean: '平均数',
        median: '中位数',
        q25: 'Q25',
        q75: 'Q75',
        outliers: '离群值',
        lowOutliers: '低值离群',
        highOutliers: '高值离群',
        modeYears: '众数年份',
        availableYears: '可用年份',
        missingYears: '缺失年份',
        topTags: '热门标签',
      },
    },
  },
  'en-US': {
    // ── Project page top-level ──────────────────────────────────
    projectId: 'Project ID',
    created: 'Created',
    updated: 'Updated',

    // ── Project overview panel ──────────────────────────────────
    overview: 'Project Overview',
    summaryTitle: 'AI Project Summary',
    summaryPlaceholder:
      'A project-level summary will appear here once the summarization agent is wired up.',
    agentSummaryLoading: 'Agent is generating project summary, please wait...',
    agentSummaryUpdated: 'Agent Summary updated',
    agentSummaryDeleted: 'Agent Summary deleted',

    // ── Project export panel ────────────────────────────────────
    export: 'Export',
    exportPanelTitle: 'Export Project',
    exportFieldsTitle: 'Export Fields',
    exporting: 'Exporting...',
    exportReady: 'Project export ready',
    citations: 'Citations',
    keepCitations: 'Keep citations',
    stripCitations: 'Keep AI results only (strip citations)',
    selectAllFields: 'Select All',
    exportFields: {
      paper_id: 'paper_id',
      project_ids: 'project_ids',
      title: 'title',
      authors: 'authors',
      year: 'year',
      publication: 'publication',
      doi: 'doi',
      custom_meta: 'custom_meta',
      raw_pdf_path: 'raw_pdf_path',
      raw_pdf_sha256: 'raw_pdf_sha256',
      images_paths: 'images_paths',
      extraction_status: 'extraction_status',
      extraction_fact_check_status: 'extraction_fact_check_status',
      analysis_fact_check_status: 'analysis_fact_check_status',
      extraction_retry_count: 'extraction_retry_count',
      analysis_retry_count: 'analysis_retry_count',
      created_at: 'created_at',
      updated_at: 'updated_at',
      quick_scan: 'quick_scan',
      synthesis_data: 'synthesis_data',
      analysis_report: 'analysis_report',
      extraction_fact_check_result: 'extraction_fact_check_result',
      analysis_fact_check_result: 'analysis_fact_check_result',
    },
    includeSandboxFiles: 'Include sandbox files',

    // ── Project edit panel ──────────────────────────────────────
    edit: 'Edit',
    editPanelTitle: 'Edit Project',
    fields: {
      name: 'Project Name',
      description: 'Project Description',
    },

    // ── Project logs panel ──────────────────────────────────────
    logsPanelTitle: 'Operation Logs',
    viewLogs: 'View Logs',
    noOperationLogs: 'No operation logs yet.',
    logTitle: 'Log #{index}',
    rawResponse: 'Raw Log',

    // ── Project delete ──────────────────────────────────────────
    delete: 'Delete',
    deleteTitle: 'Delete Project',
    deleteConfirmTitle: 'Delete Project',
    deleteConfirmHint:
      'Type the project name "{name}" to confirm deletion. This action cannot be undone.',
    deleteConfirmPapers:
      'This project contains {count} paper(s). Deleting will remove these associations.',
    deleteConfirmInputLabel: 'Project Name',
    deleteConfirmMismatch: 'The project name does not match.',
    deleteConfirmSimple: 'Delete project {projectId}? This action cannot be undone.',
    deleteConfirmWithPapers:
      'Project {projectId} contains {paperCount} paper(s).\nDeleting the project will unlink all related papers from this project.\nContinue?',
    projectDeleted: 'Project deleted',
    projectUpdated: 'Project updated',

    // ── Project files ──────────────────────────────────────────
    projectFiles: 'Project Files',
    createFile: 'New File',
    createDir: 'New Folder',
    dirName: 'Folder Name',
    dirNamePlaceholder: 'e.g. notes',
    dirCreated: 'Folder {name} created',
    fileName: 'File Name',
    fileNamePlaceholder: 'e.g. notes/idea.md',
    fileContent: 'Content',
    fileContentPlaceholder: 'Enter file content...',
    fileCreated: 'File {name} created',
    fileUpdated: 'File updated',
    fileDeleted: 'File {name} deleted',
    fileExported: 'File exported as {format}',
    exportFile: 'Export',
    confirmDeleteFile: 'Delete file "{name}"?',
    confirmDeleteDir: 'Delete folder "{name}" and all its contents?',
    dirDeleted: 'Folder {name} deleted',
    noFiles: 'No files',

    // -- Project papers ──────────────────────────────────────────
    papers: 'Papers',

    // ── Project drawer ─────────────────────────────────────────
    projectDrawer: {
      tabPapers: 'Papers',
      empty: 'No detail content is currently available.',
      paperLinkNotSupported: 'This operation is not supported',
    },

    // ── Actions (shared) ────────────────────────────────────────
    actions: {
      back: 'Back',
      create: 'Create',
      open: 'Open',
      delete: 'Delete',
      close: 'Close',
      edit: 'Edit',
      confirm: 'Confirm',
      search: 'Search',
      cancel: 'Cancel',
      retry: 'Retry',
      refresh: 'Refresh',
      copy: 'Copy',
      export: 'Export',
      exporting: 'Exporting...',
      selectAll: 'Select All',
      clear: 'Clear',
      link: 'Link',
      linkToProject: 'Link to Project',
      unlink: 'Unlink',
      save: 'Save',
    },

    // ── Common ──────────────────────────────────────────────────
    common: {
      loading: 'Loading...',
      createdAt: 'Created',
      updatedAt: 'Updated',
      total: 'Total',
    },

    // ── Errors ──────────────────────────────────────────────────
    errors: {
      requestFailed: 'Request failed. Please try again later.',
      listProjects: 'Failed to fetch project list',
      createProject: 'Failed to create project',
      deleteProject: 'Failed to delete project',
    },

    // ── Count summary ──────────────────────────────────────────
    countSummary: '{count} projects',
    filterSummary: 'Filter: {keyword}',
    searchLabel: 'Current Filter',
    searchIdle: 'No active filter',
    empty: 'No projects',
    emptyTitle: 'No projects yet',
    emptyHint: 'Create the first research project.',

    stats: {
      total: 'Total Projects',
      active: 'Active',
      recent: 'Recent Updates',
      showing: 'Visible',
    },
    statusCards: {
      total: 'Total Papers',
    },

    // ── Librarian global finder ─────────────────────────────────
    librarian: {
      globalFinder: {
        yearStats: 'Year Statistics',
        mean: 'Mean',
        median: 'Median',
        q25: 'Q25',
        q75: 'Q75',
        outliers: 'Outliers',
        lowOutliers: 'Low Outliers',
        highOutliers: 'High Outliers',
        modeYears: 'Mode Years',
        availableYears: 'Available Years',
        missingYears: 'Missing Years',
        topTags: 'Top Tags',
      },
    },
  },
} as const
