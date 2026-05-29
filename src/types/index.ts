export interface BibEntry {
  id: string
  key: string
  type: string
  fields: Record<string, string>
  raw: string
  validationErrors?: string[]
  sourceFile?: string
  // true se algum campo continha comandos LaTeX de acento que foram normalizados
  hadLatexAccents?: boolean
}

export interface BibFile {
  id: string
  name: string
  size: number
  content: string
  entries: BibEntry[]
}

export interface DuplicateGroup {
  id: string
  entries: BibEntry[]
}

export interface BibStats {
  totalEntries: number
  duplicateGroups: number
  fileCount: number
  entryTypes: Record<string, number>
  entriesWithErrors: number
}

// Campos configuráveis para deduplicação
export type DeduplicationField =
  | 'title' | 'author' | 'year' | 'doi' | 'journal' | 'booktitle' | 'key'

export interface DeduplicationOptions {
  fields: DeduplicationField[]
  sensitivity: 'exact' | 'fuzzy'
}

// Filtro por arquivos .tex
export interface TexFile {
  filename: string
  content: string
}

export interface TexFilterOptions {
  citationCommands: string[]
  texFiles: TexFile[]
}

// Ordenação
export type SortField = 'key' | 'title' | 'author' | 'year'
export type SortDirection = 'asc' | 'desc'

export interface SortOptions {
  field: SortField
  direction: SortDirection
}

// Formato de exportação
export type ExportFormat = 'bibtex' | 'abnt' | 'bibtex-normalized'
