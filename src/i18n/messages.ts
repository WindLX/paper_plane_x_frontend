import { common } from './modules/common'
import { language } from './modules/language'
import { nav } from './modules/nav'
import { theme } from './modules/theme'
import { routes } from './modules/routes'
import { shell } from './modules/shell'
import { actions } from './modules/actions'
import { dialog } from './modules/dialog'
import { copyable } from './modules/copyable'
import { errors } from './modules/errors'
import { status } from './modules/status'
import { projects } from './modules/projects'
import { projectDetail } from './modules/projectDetail'
import { chat } from './modules/chat'
import { tasks } from './modules/tasks'
import { traces } from './modules/traces'
import { drawer } from './modules/drawer'
import { library } from './modules/library'
import { settings } from './modules/settings'
import { taskDetail } from './modules/taskDetail'
import { trace } from './modules/trace'
import { notFound } from './modules/notFound'
import { librarian } from './modules/librarian'

export const messages = {
  'zh-CN': {
    common: common['zh-CN'],
    language: language['zh-CN'],
    nav: nav['zh-CN'],
    theme: theme['zh-CN'],
    routes: routes['zh-CN'],
    shell: shell['zh-CN'],
    actions: actions['zh-CN'],
    dialog: dialog['zh-CN'],
    copyable: copyable['zh-CN'],
    errors: errors['zh-CN'],
    status: status['zh-CN'],
    projects: projects['zh-CN'],
    projectDetail: projectDetail['zh-CN'],
    chat: chat['zh-CN'],
    tasks: tasks['zh-CN'],
    traces: traces['zh-CN'],
    drawer: drawer['zh-CN'],
    library: library['zh-CN'],
    settings: settings['zh-CN'],
    taskDetail: taskDetail['zh-CN'],
    trace: trace['zh-CN'],
    notFound: notFound['zh-CN'],
    librarian: librarian['zh-CN'],
  },
  'en-US': {
    common: common['en-US'],
    language: language['en-US'],
    nav: nav['en-US'],
    theme: theme['en-US'],
    routes: routes['en-US'],
    shell: shell['en-US'],
    actions: actions['en-US'],
    dialog: dialog['en-US'],
    copyable: copyable['en-US'],
    errors: errors['en-US'],
    status: status['en-US'],
    projects: projects['en-US'],
    projectDetail: projectDetail['en-US'],
    chat: chat['en-US'],
    tasks: tasks['en-US'],
    traces: traces['en-US'],
    drawer: drawer['en-US'],
    library: library['en-US'],
    settings: settings['en-US'],
    taskDetail: taskDetail['en-US'],
    trace: trace['en-US'],
    notFound: notFound['en-US'],
    librarian: librarian['en-US'],
  },
} as const

export type AppMessages = typeof messages
