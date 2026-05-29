import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SearchBox } from '@/components/SearchBox'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Loader2, Copy, Merge, CheckCircle, FileText, Trash,
  ChevronDown, Filter, SortAsc, Download,
} from 'lucide-react'
import { HelpTooltip } from '@/components/HelpTooltip'
import { TexFileSelector } from '@/components/TexFileSelector'
import type {
  DeduplicationField,
  DeduplicationOptions,
  TexFilterOptions,
  TexFile,
  SortOptions,
  SortField,
  SortDirection,
  ExportFormat,
} from '@/types'

const DEDUP_FIELDS: { value: DeduplicationField; label: string }[] = [
  { value: 'title',     label: 'Título' },
  { value: 'author',    label: 'Autor' },
  { value: 'year',      label: 'Ano' },
  { value: 'doi',       label: 'DOI' },
  { value: 'journal',   label: 'Periódico' },
  { value: 'booktitle', label: 'Evento/Livro' },
  { value: 'key',       label: 'Chave BibTeX' },
]

interface ActionsProps {
  onShowDuplicates: (options: DeduplicationOptions) => void
  onRemoveDuplicates: (options: DeduplicationOptions) => void
  onMerge: () => void
  onValidate: () => void
  onReport: () => void
  onSearch: (query: string) => void
  searchQuery: string
  isLoading: boolean
  hasSelection: boolean
  onFilterByTex: (options: TexFilterOptions) => void
  onSort: (options: SortOptions) => void
  onExport: (format: ExportFormat) => void
}

export const Actions = ({
  onShowDuplicates,
  onRemoveDuplicates,
  onMerge,
  onValidate,
  onReport,
  onSearch,
  searchQuery,
  isLoading,
  hasSelection,
  onFilterByTex,
  onSort,
  onExport,
}: ActionsProps) => {
  // Estado deduplicação
  const [dedupFields, setDedupFields] = useState<DeduplicationField[]>(['title', 'doi'])
  const [dedupSensitivity, setDedupSensitivity] = useState<'exact' | 'fuzzy'>('fuzzy')

  const toggleField = (f: DeduplicationField) =>
    setDedupFields((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    )

  const dedupOptions: DeduplicationOptions = { fields: dedupFields, sensitivity: dedupSensitivity }

  // Estado filtro .tex
  const [texFiles, setTexFiles] = useState<TexFile[]>([])
  const [texCommands, setTexCommands] = useState<string[]>([
    'cite', 'textcite', 'citep', 'citet', 'autocite',
  ])

  // Estado ordenação
  const [sortField, setSortField] = useState<SortField>('key')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')

  const SectionLabel = ({ label, tip }: { label: string; tip: string }) => (
    <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
      {label}
      <HelpTooltip text={tip} />
    </span>
  )

  return (
    <div className="space-y-4">

      {/* Botões principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Button
          onClick={() => onShowDuplicates(dedupOptions)}
          disabled={isLoading || !hasSelection}
          variant="outline"
          className="w-full justify-start"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
          Detectar Duplicatas
        </Button>
        <Button
          onClick={() => onRemoveDuplicates(dedupOptions)}
          disabled={isLoading || !hasSelection}
          variant="outline"
          className="w-full justify-start"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
          Remover Duplicatas (Auto)
        </Button>
        <Button
          onClick={onMerge}
          disabled={isLoading || !hasSelection}
          variant="outline"
          className="w-full justify-start"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Merge className="mr-2 h-4 w-4" />}
          Fazer Merge
        </Button>
        <Button
          onClick={onValidate}
          disabled={isLoading || !hasSelection}
          variant="outline"
          className="w-full justify-start"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          Validar Arquivo
        </Button>
        <Button
          onClick={onReport}
          disabled={isLoading || !hasSelection}
          variant="outline"
          className="w-full justify-start"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          Gerar Relatório
        </Button>
      </div>

      {/* Configurar deduplicação */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <SectionLabel
            label="Configurar deduplicação"
            tip="Escolha quais campos serão comparados para identificar entradas duplicadas. Quanto mais campos, mais rigorosa a comparação."
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3 pl-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEDUP_FIELDS.map(({ value, label }) => (
              <div key={value} className="flex items-center gap-2">
                <Checkbox
                  id={`dedup-${value}`}
                  checked={dedupFields.includes(value)}
                  onCheckedChange={() => toggleField(value)}
                />
                <Label htmlFor={`dedup-${value}`} className="text-sm cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm shrink-0">Sensibilidade</Label>
            <Select
              value={dedupSensitivity}
              onValueChange={(v) => setDedupSensitivity(v as 'exact' | 'fuzzy')}
            >
              <SelectTrigger className="h-8 w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fuzzy">Fuzzy — ignora capitalização</SelectItem>
                <SelectItem value="exact">Exato — match literal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Filtrar pelo .tex */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <Filter className="h-4 w-4 text-muted-foreground" />
          <SectionLabel
            label="Filtrar pelo .tex"
            tip="Carregue seus arquivos .tex e o BibManager vai manter apenas as referências que você realmente citou no documento. Útil antes de submeter um artigo."
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 pl-2">
          <TexFileSelector
            files={texFiles}
            commands={texCommands}
            onFilesChange={setTexFiles}
            onCommandsChange={setTexCommands}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={texFiles.length === 0 || texCommands.length === 0 || !hasSelection}
            onClick={() => onFilterByTex({ citationCommands: texCommands, texFiles })}
            className="w-full mt-3"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtrar BibTeX pelo .tex
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Ordenar referências */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <SortAsc className="h-4 w-4 text-muted-foreground" />
          <SectionLabel
            label="Ordenar referências"
            tip="Reordena as entradas do .bib pelo campo escolhido. O arquivo exportado seguirá essa ordem."
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 pl-2">
          <div className="flex gap-2">
            <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
              <SelectTrigger className="h-8 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="key">Chave BibTeX</SelectItem>
                <SelectItem value="title">Título</SelectItem>
                <SelectItem value="author">Autor</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as SortDirection)}>
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">A → Z</SelectItem>
                <SelectItem value="desc">Z → A</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasSelection}
              onClick={() => onSort({ field: sortField, direction: sortDir })}
            >
              Aplicar
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Exportar */}
      <div className="flex gap-2 pt-1 border-t flex-wrap">
        <div className="flex items-center gap-1.5 flex-1 min-w-full mb-1">
          <span className="text-xs text-muted-foreground">Exportar</span>
          <HelpTooltip text="Exporta as referências atualmente exibidas. '.bib' preserva o arquivo original intacto. '.bib (unicode)' converte comandos LaTeX de acento (ex: {\'{a}}) para caracteres Unicode (ex: á) — útil para editores que não processam LaTeX. 'ABNT' gera um .txt formatado conforme NBR 6023:2018." />
        </div>
        <Button size="sm" variant="outline" disabled={!hasSelection} onClick={() => onExport('bibtex')}>
          <Download className="h-4 w-4 mr-1.5" /> .bib
        </Button>
        <Button size="sm" variant="outline" disabled={!hasSelection} onClick={() => onExport('bibtex-normalized')}>
          <Download className="h-4 w-4 mr-1.5" /> .bib (unicode)
        </Button>
        <Button size="sm" variant="outline" disabled={!hasSelection} onClick={() => onExport('abnt')}>
          <Download className="h-4 w-4 mr-1.5" /> ABNT
        </Button>
      </div>

      {/* Busca rápida */}
      <div className="pt-1">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-xs text-muted-foreground">Busca rápida</span>
          <HelpTooltip text="Filtra as entradas pelo texto digitado, buscando em título, autor, chave e ano simultaneamente." />
        </div>
        <SearchBox value={searchQuery} onChange={onSearch} disabled={!hasSelection} />
      </div>
    </div>
  )
}
