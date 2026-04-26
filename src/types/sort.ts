export type SortOrder = 'default' | 'asc' | 'desc'

export type SortKey = string | null

export type PaperSortKey = 'created_at' | 'updated_at' | 'title' | null
export type ProjectSortKey = 'created_at' | 'updated_at' | 'name' | null
export type TaskSortKey = 'created_at' | 'status' | null
export type GlobalFinderSortKey = 'title' | 'year' | 'verdict' | null