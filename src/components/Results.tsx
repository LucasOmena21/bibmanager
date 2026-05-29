import { BibEntry, DuplicateGroup, BibStats } from '@/types'
import { HelpTooltip } from './HelpTooltip'
import { Button } from './ui/button'
import { Download, Copy } from 'lucide-react'
import { DuplicateGroupCard } from './DuplicateGroupCard'
import { EntryCard } from './EntryCard'
import { StatsGrid } from './StatsGrid'
import { ReportCharts } from './ReportCharts'
import { MergeLog, MergeLogEntry } from './MergeLog'
import { ScrollArea } from './ui/scroll-area'

type ResultsView = 'duplicates' | 'merged' | 'validation' | 'report' | 'search'

interface ResultsProps {
  view: ResultsView
  data: any
  stats?: BibStats
  // Corpus completo para os gráficos do relatório
  allEntries?: BibEntry[]
  // Log das entradas removidas pelo merge
  mergeLog?: MergeLogEntry[]
  onDownload: () => void
  onCopyToClipboard?: () => void
  onEntryRemove?: (id: string) => void
  latexAccentCount?: number
  lastActionMs?: number | null
  onExportNormalized?: () => void
  onExportABNT?: () => void
  keptDuplicateIds?: Map<string, Set<string>>
  onDuplicateSelectionChange?: (
    groupId: string,
    entryId: string,
    keep: boolean,
  ) => void
}

export const Results = ({
  view,
  data,
  stats,
  allEntries = [],
  mergeLog = [],
  onDownload,
  onCopyToClipboard,
  onEntryRemove,
  latexAccentCount = 0,
  lastActionMs,
  onExportNormalized,
  onExportABNT,
  keptDuplicateIds,
  onDuplicateSelectionChange,
}: ResultsProps) => {
  const getTitle = () => {
    switch (view) {
      case 'duplicates':  return 'Duplicatas Encontradas'
      case 'merged':      return 'Arquivo Unificado'
      case 'validation':  return 'Validação de Entradas'
      case 'report':      return 'Relatório Geral'
      case 'search':      return 'Resultados da Busca'
      case 'tex-filter':  return 'Referências Usadas no .tex'
      case 'sorted':      return 'Referências Ordenadas'
      default:            return 'Resultados'
    }
  }

  const renderContent = () => {
    if (view === 'report' && stats) {
      return (
        <>
          <StatsGrid stats={stats} latexAccentCount={latexAccentCount} />
          {/* Gráficos analíticos — usa corpus completo, não filtro de busca */}
          <ReportCharts entries={allEntries} topN={10} />
        </>
      )
    }

    if (view === 'duplicates') {
      const duplicateGroups = data as DuplicateGroup[]
      if (duplicateGroups.length === 0) {
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma duplicata encontrada nos arquivos selecionados.</p>
          </div>
        )
      }
      return (
        <div className="space-y-4">
          {duplicateGroups.map((group) => (
            <DuplicateGroupCard
              key={group.id}
              group={group}
              keptEntryIds={keptDuplicateIds?.get(group.id) || new Set()}
              onSelectionChange={(entryId, keep) =>
                onDuplicateSelectionChange?.(group.id, entryId, keep)
              }
            />
          ))}
        </div>
      )
    }

    const entries = data as BibEntry[]

    // Validação sem erros: mostra banner de sucesso + todas as entradas do corpus
    if (view === 'validation' && entries.length === 0) {
      return (
        <>
          <div className="flex items-center gap-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-3 mb-4">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-medium text-green-800 dark:text-green-300">
                Nenhum problema encontrado
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                Todas as {allEntries.length} entrada(s) possuem os campos obrigatórios.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {allEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                mode={{ view: 'validation', onRemove: onEntryRemove! }}
              />
            ))}
          </div>
        </>
      )
    }

    if (entries.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma entrada encontrada para exibir.</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            mode={{ view: view as any, onRemove: onEntryRemove! }}
          />
        ))}
      </div>
    )
  }

  const isDuplicatesView = view === 'duplicates'

  return (
    <div className="w-full results-section active">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{getTitle()}</h2>
          <p className="text-sm text-muted-foreground">
            {view === 'merged'     && 'Revise o conteúdo abaixo antes de baixar.'}
            {view === 'validation' && (
              Array.isArray(data) && data.length > 0
                ? `${data.length} entrada(s) com problema(s) detectado(s).`
                : '✓ Nenhum problema encontrado. Todas as entradas estão válidas.'
            )}
            {view === 'search'     && `Encontrados ${Array.isArray(data) ? data.length : 0} resultados.`}
            {(view as string) === 'tex-filter' && `${Array.isArray(data) ? data.length : 0} referência(s) efetivamente citadas.`}
            {(view as string) === 'sorted'     && `${Array.isArray(data) ? data.length : 0} referência(s) ordenadas.`}
            {view === 'duplicates' && `${Array.isArray(data) ? data.length : 0} grupo(s) encontrado(s). Use os toggles para escolher o que manter.`}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {(view === 'merged' || view === 'search' || view === 'validation' || view === 'tex-filter' || view === 'sorted') &&
            onCopyToClipboard && (
              <Button variant="outline" onClick={onCopyToClipboard} className="w-full sm:w-auto">
                <Copy className="h-4 w-4 mr-2" /> Copiar
              </Button>
            )}
          {(view === 'merged' || view === 'search' || view === 'validation' || view === 'tex-filter' || view === 'sorted') && onExportABNT && (
            <Button variant="outline" onClick={onExportABNT} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" /> ABNT
            </Button>
          )}
          {onExportNormalized && (
            <div className="flex items-center gap-1">
              <Button variant="outline" onClick={onExportNormalized} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" /> .bib (unicode)
              </Button>
              <HelpTooltip
                variant="purple"
                text="Exporta o .bib com comandos LaTeX de acento convertidos para Unicode. Ex: {\'{a}} → á, V{\'{\i}}tor → Vítor. Mais legível em editores de texto e sistemas que não processam LaTeX. O arquivo original (.bib) permanece intacto."
              />
            </div>
          )}
          <Button onClick={onDownload} className="w-full sm:w-auto btn-download">
            <Download className="h-4 w-4 mr-2" />
            {view === 'duplicates' ? 'Aplicar e Baixar' : 'Download .bib'}
          </Button>
        </div>
      </div>

      {/* Banner de tempo de execução */}
      {lastActionMs != null && view !== 'idle' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 px-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
          Operação concluída em{' '}
          <span className="font-medium text-foreground">
            {lastActionMs < 1000
              ? `${lastActionMs.toFixed(0)} ms`
              : `${(lastActionMs / 1000).toFixed(2)} s`}
          </span>
        </div>
      )}

      {/* Relatório: sem scroll fixo */}
      {view === 'report' ? (
        renderContent()
      ) : isDuplicatesView ? (
        // Duplicatas: overflow-y nativo (não ScrollArea do shadcn que bloqueia
        // eventos de clique). max-h-[70vh] limita a altura e cria scroll interno.
        <div
          className="overflow-y-auto pb-4 pr-2"
          style={{ maxHeight: '70vh' }}
        >
          {renderContent()}
        </div>
      ) : (
        // Demais views: overflow-y nativo igual às duplicatas
        // ScrollArea do shadcn bloqueia cliques nos footers dos cards
        <div
          className="overflow-y-auto pb-4 pr-2"
          style={{ maxHeight: '70vh' }}
        >
          {renderContent()}
        </div>
      )}

      {/* Log do merge — aparece abaixo dos resultados */}
      {mergeLog.length > 0 && <MergeLog log={mergeLog} />}
    </div>
  )
}
