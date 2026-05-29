import { useState } from 'react'
import { BibFile, BibEntry, DuplicateGroup, BibStats } from '@/types'
import type {
  DeduplicationOptions,
  TexFilterOptions,
  SortOptions,
  ExportFormat,
} from '@/types'
import {
  parseBibFile,
  findDuplicates,
  mergeAndDeduplicate,
  generateBibString,
  generateNormalizedBibString,
  validateEntries,
  calculateStats,
  filterByTexFiles,
  sortEntries,
  exportABNT,
} from '@/lib/bib-parser'
import { FileUpload } from '@/components/FileUpload'
import { UploadedFilesList } from '@/components/UploadedFilesList'
import { Actions } from '@/components/Actions'
import { Results } from '@/components/Results'
import type { MergeLogEntry } from '@/components/MergeLog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

type ViewState =
  | 'idle' | 'duplicates' | 'merged' | 'validation'
  | 'report' | 'search' | 'tex-filter' | 'sorted'

const Index = () => {
  const [files, setFiles] = useState<BibFile[]>([])
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [view, setView] = useState<ViewState>('idle')
  const [results, setResults] = useState<DuplicateGroup[] | BibEntry[]>([])
  const [stats, setStats] = useState<BibStats | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [keptDuplicateIds, setKeptDuplicateIds] = useState<Map<string, Set<string>>>(new Map())
  const [mergeLog, setMergeLog] = useState<MergeLogEntry[]>([])
  const [lastActionMs, setLastActionMs] = useState<number | null>(null)

  const { toast } = useToast()

  const getSelectedFiles = () => files.filter((f) => selectedFileIds.has(f.id))

  // Executa a ação medindo o tempo real com performance.now().
  // O setTimeout de 600ms é só para animar o spinner — o tempo medido
  // é apenas o da operação em si, sem o delay artificial.
  const processAction = (action: () => void) => {
    setIsLoading(true)
    setSearchQuery('')
    setTimeout(() => {
      const t0 = performance.now()
      action()
      const ms = performance.now() - t0
      setLastActionMs(ms)
      setIsLoading(false)
    }, 600)
  }

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFilesUpload = (
    uploadedFiles: { name: string; size: number; content: string }[],
  ) => {
    const newBibFiles: BibFile[] = uploadedFiles.map((f, i) => ({
      ...f,
      id: `${Date.now()}-${i}`,
      entries: parseBibFile(f.content, f.name),
    }))
    setFiles((prev) => {
      const newSet = new Set(selectedFileIds)
      newBibFiles.forEach((f) => newSet.add(f.id))
      setSelectedFileIds(newSet)
      return [...prev, ...newBibFiles]
    })
  }

  const handleFileSelect = (id: string) =>
    setSelectedFileIds((prev) => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })

  const handleFileRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setSelectedFileIds((prev) => { const s = new Set(prev); s.delete(id); return s })
    if (files.length <= 1) { setView('idle'); setResults([]) }
  }

  const handleRemoveAll = () => {
    setFiles([]); setSelectedFileIds(new Set()); setView('idle'); setResults([])
  }

  // Detectar duplicatas com campos configuráveis
  const handleShowDuplicates = (options: DeduplicationOptions) =>
    processAction(() => {
      const selected = getSelectedFiles()
      const allEntries = selected.flatMap((f) => f.entries)
      const map = new Map<string, BibEntry[]>()
      allEntries.forEach((entry) => {
        const parts = options.fields.map((field) => {
          if (field === 'key') return entry.key
          const val = entry.fields[field] ?? ''
          return options.sensitivity === 'fuzzy'
            ? val.toLowerCase().replace(/\s+/g, ' ').replace(/[{}]/g, '').trim()
            : val.trim()
        })
        const key = parts.join('||')
        if (!key.replace(/\|/g, '').trim()) return
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(entry)
      })
      let groupId = 0
      const duplicates: DuplicateGroup[] = []
      map.forEach((entries) => {
        if (entries.length > 1) duplicates.push({ id: `group-${groupId++}`, entries })
      })
      setResults(duplicates)
      setMergeLog([])
      setView('duplicates')
      setKeptDuplicateIds(
        new Map(duplicates.map((g) => {
          const best = g.entries.reduce((p, c) =>
            Object.keys(c.fields).length > Object.keys(p.fields).length ? c : p)
          return [g.id, new Set([best.id])]
        })),
      )
    })

  // Remover duplicatas automático com log
  const handleRemoveDuplicatesAuto = (options: DeduplicationOptions) =>
    processAction(() => {
      const selected = getSelectedFiles()
      const duplicates = findDuplicates(selected)
      const log: MergeLogEntry[] = []
      duplicates.forEach((g) => {
        const best = g.entries.reduce((p, c) =>
          Object.keys(c.fields).length > Object.keys(p.fields).length ? c : p)
        g.entries.forEach((e) => {
          if (e.id !== best.id) {
            log.push({
              removed: { key: e.key, title: e.fields.title || '', sourceFile: e.sourceFile },
              keptKey: best.key,
            })
          }
        })
      })
      setResults(mergeAndDeduplicate(selected))
      setMergeLog(log)
      setView('merged')
      toast({
        title: 'Duplicatas removidas',
        description: `${log.length} entrada(s) removida(s). Veja o log abaixo.`,
      })
    })

  // Merge: mostra duplicatas para revisão manual
  const handleMerge = () =>
    processAction(() => {
      const selected = getSelectedFiles()
      const duplicates = findDuplicates(selected)
      if (duplicates.length === 0) {
        setResults(selected.flatMap((f) => f.entries))
        setMergeLog([])
        setView('merged')
        toast({ title: 'Merge concluído', description: 'Nenhuma duplicata encontrada.' })
        return
      }
      setResults(duplicates)
      setMergeLog([])
      setView('duplicates')
      setKeptDuplicateIds(
        new Map(duplicates.map((g) => {
          const best = g.entries.reduce((p, c) =>
            Object.keys(c.fields).length > Object.keys(p.fields).length ? c : p)
          return [g.id, new Set([best.id])]
        })),
      )
      toast({
        title: `${duplicates.length} grupo(s) de duplicatas`,
        description: 'Revise quais entradas manter antes de baixar.',
      })
    })

  const handleValidate = () =>
    processAction(() => {
      const allEntries = getSelectedFiles().flatMap((f) => f.entries)
      const validated = validateEntries(allEntries)
      const withErrors = validated.filter((e) => e.validationErrors?.length)
      // Passa só as entradas com erro; se não houver, passa array vazio
      // para a view mostrar mensagem de sucesso em vez de listar tudo
      setResults(withErrors)
      setView('validation')
    })

  const handleReport = () =>
    processAction(() => {
      setStats(calculateStats(getSelectedFiles()))
      setView('report')
    })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) { if (view === 'search') setView('idle'); return }
    const lq = query.toLowerCase()
    setResults(
      getSelectedFiles().flatMap((f) => f.entries).filter((e) =>
        (e.fields.title?.toLowerCase() || '').includes(lq) ||
        (e.fields.author?.toLowerCase() || '').includes(lq) ||
        (e.fields.year?.toLowerCase() || '').includes(lq) ||
        e.key.toLowerCase().includes(lq),
      ),
    )
    setView('search')
  }

  // Filtro por .tex
  const handleFilterByTex = (options: TexFilterOptions) =>
    processAction(() => {
      const { filtered, missingKeys } = filterByTexFiles(getSelectedFiles(), options)
      setResults(filtered)
      setView('tex-filter' as ViewState)
      toast({
        title: `Filtro aplicado — ${filtered.length} referência(s)`,
        description: missingKeys.length > 0
          ? `⚠️ ${missingKeys.length} chave(s) não encontrada(s) no .bib.`
          : 'Todas as chaves citadas foram encontradas.',
      })
    })

  // Ordenação
  const handleSort = (options: SortOptions) =>
    processAction(() => {
      setResults(sortEntries(getSelectedFiles().flatMap((f) => f.entries), options))
      setView('sorted' as ViewState)
    })

  // Exportação com formato
  const handleExport = (format: ExportFormat) => {
    const entries = view === 'idle'
      ? getSelectedFiles().flatMap((f) => f.entries)
      : (results as BibEntry[])
    if (format === 'abnt') {
      triggerDownload(exportABNT(entries), 'referencias_abnt.txt')
    } else if (format === 'bibtex-normalized') {
      triggerDownload(generateNormalizedBibString(entries), 'referencias_unicode.bib')
    } else {
      triggerDownload(generateBibString(entries), 'referencias.bib')
    }
  }

  const handleDownload = () => {
    if (view === 'duplicates') {
      const allKeptIds = new Set<string>()
      keptDuplicateIds.forEach((s) => s.forEach((id) => allKeptIds.add(id)))
      const allEntries = getSelectedFiles().flatMap((f) => f.entries)
      const log: MergeLogEntry[] = [];
      (results as DuplicateGroup[]).forEach((g) => {
        const kept = g.entries.filter((e) => allKeptIds.has(e.id))
        g.entries.filter((e) => !allKeptIds.has(e.id)).forEach((rem) => {
          log.push({
            removed: { key: rem.key, title: rem.fields.title || '', sourceFile: rem.sourceFile },
            keptKey: kept[0]?.key || '?',
          })
        })
      })
      setMergeLog(log)
      triggerDownload(
        generateBibString(allEntries.filter((e) => allKeptIds.has(e.id))),
        'duplicates_removed.bib',
      )
      toast({
        title: 'Arquivo baixado',
        description: `${log.length} entrada(s) removida(s). Veja o log abaixo.`,
      })
    } else if (view === 'report') {
      triggerDownload(generateBibString(mergeAndDeduplicate(getSelectedFiles())), 'report_export.bib')
    } else {
      triggerDownload(generateBibString(results as BibEntry[]), `${view}_export.bib`)
    }
  }

  const handleCopyToClipboard = () =>
    navigator.clipboard.writeText(generateBibString(results as BibEntry[])).then(() =>
      toast({ title: 'Copiado!', description: 'Conteúdo na área de transferência.' }),
    )

  const handleManualEntryRemove = (id: string) =>
    setResults((prev) =>
      Array.isArray(prev) ? (prev as BibEntry[]).filter((e) => e.id !== id) : prev,
    )

  const handleDuplicateSelectionChange = (groupId: string, entryId: string, keep: boolean) =>
    setKeptDuplicateIds((prevMap) => {
      const m = new Map(prevMap)
      const s = new Set(m.get(groupId) || [])
      keep ? s.add(entryId) : s.delete(entryId)
      m.set(groupId, s)
      return m
    })

  const handleExportNormalized = () => {
    const entries = view === 'idle'
      ? getSelectedFiles().flatMap((f) => f.entries)
      : view === 'duplicates'
        ? (() => {
            const allKeptIds = new Set<string>()
            keptDuplicateIds.forEach((s) => s.forEach((id) => allKeptIds.add(id)))
            return getSelectedFiles().flatMap((f) => f.entries).filter((e) => allKeptIds.has(e.id))
          })()
        : (results as BibEntry[])
    triggerDownload(generateNormalizedBibString(entries), 'referencias_unicode.bib')
  }

  const handleExportABNT = () =>
    triggerDownload(exportABNT(results as BibEntry[]), 'referencias_abnt.txt')

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card>
        <CardHeader><CardTitle>1. Carregar Arquivos .bib</CardTitle></CardHeader>
        <CardContent>
          <FileUpload onFilesUpload={handleFilesUpload} isLoading={isLoading} />
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader><CardTitle>2. Arquivos Carregados</CardTitle></CardHeader>
          <CardContent>
            <UploadedFilesList
              files={files}
              selectedFileIds={selectedFileIds}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              onRemoveAll={handleRemoveAll}
            />
          </CardContent>
        </Card>
      )}

      {files.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader><CardTitle>3. Operações e Busca</CardTitle></CardHeader>
          <CardContent>
            <Actions
              isLoading={isLoading}
              hasSelection={selectedFileIds.size > 0}
              onShowDuplicates={handleShowDuplicates}
              onRemoveDuplicates={handleRemoveDuplicatesAuto}
              onMerge={handleMerge}
              onValidate={handleValidate}
              onReport={handleReport}
              onSearch={handleSearch}
              searchQuery={searchQuery}
              onFilterByTex={handleFilterByTex}
              onSort={handleSort}
              onExport={handleExport}
            />
          </CardContent>
        </Card>
      )}

      {view !== 'idle' && (
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <Results
              view={view as any}
              data={results}
              stats={stats}
              allEntries={getSelectedFiles().flatMap((f) => f.entries)}
              mergeLog={mergeLog}
              lastActionMs={lastActionMs}
              latexAccentCount={getSelectedFiles().flatMap((f) => f.entries).filter((e) => e.hadLatexAccents).length}
              onDownload={handleDownload}
              onCopyToClipboard={
                view !== 'duplicates' && view !== 'report' ? handleCopyToClipboard : undefined
              }
              onEntryRemove={
                view !== 'duplicates' && view !== 'report' ? handleManualEntryRemove : undefined
              }
              onExportNormalized={handleExportNormalized}
              onExportABNT={
                view !== 'duplicates' && view !== 'report' ? handleExportABNT : undefined
              }
              keptDuplicateIds={view === 'duplicates' ? keptDuplicateIds : undefined}
              onDuplicateSelectionChange={
                view === 'duplicates' ? handleDuplicateSelectionChange : undefined
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Index
