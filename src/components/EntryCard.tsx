import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, AlertCircle, ExternalLink } from 'lucide-react'
import { BibEntry } from '@/types'
import { googleScholarUrl } from '@/lib/bib-parser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type EntryCardMode =
  | {
      view: 'duplicates'
      sourceFile?: string
      onToggleKeep: (id: string, keep: boolean) => void
      isKept: boolean
    }
  | { view: 'merged' | 'search' | 'validation'; onRemove: (id: string) => void }

interface EntryCardProps {
  entry: BibEntry
  mode: EntryCardMode
}

export const EntryCard = ({ entry, mode }: EntryCardProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasErrors = entry.validationErrors && entry.validationErrors.length > 0
  const isDuplicate = mode.view === 'duplicates'
  const isKept = isDuplicate && mode.isKept

  return (
    <Card
      className={cn(
        'bg-card shadow-subtle animate-fade-in transition-opacity',
        hasErrors && 'border-destructive/50',
        // Entradas marcadas para remover ficam mais transparentes
        isDuplicate && !isKept && 'opacity-50',
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="flex flex-row items-center justify-between p-3">
          <div className="flex flex-col gap-0.5 overflow-hidden flex-1 min-w-0">
            <div className="font-mono text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <span className="text-primary font-semibold uppercase">
                {entry.type}
              </span>
              <span className="font-bold text-foreground truncate">{entry.key}</span>
            </div>
            <div className="text-sm truncate font-medium">
              {entry.fields.title || 'Sem título'}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {entry.fields.author || 'Autor desconhecido'} •{' '}
              {entry.fields.year || 'Ano desconhecido'}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <a
              href={googleScholarUrl(entry)}
              target="_blank"
              rel="noopener noreferrer"
              title="Buscar no Google Scholar"
            >
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {isOpen
                  ? <ChevronUp className="h-3.5 w-3.5" />
                  : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        {hasErrors && (
          <div className="px-3 pb-2">
            <div className="bg-destructive/10 text-destructive text-xs p-2 rounded flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <ul className="list-disc list-inside">
                {entry.validationErrors?.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <CollapsibleContent>
          <CardContent className="p-3 pt-0">
            <pre className="bg-secondary p-3 rounded-md text-xs font-mono overflow-x-auto max-h-40 whitespace-pre-wrap break-all">
              <code>{entry.raw}</code>
            </pre>
          </CardContent>
        </CollapsibleContent>

        {/* CORREÇÃO PRINCIPAL: footer do modo duplicatas
            O Switch agora fica em uma linha dedicada e clara.
            O pointer-events garante que o clique funcione mesmo dentro
            de containers com overflow. */}
        <CardFooter className="p-3 pt-0">
          {isDuplicate && (
            <div className="w-full">
              {/* Linha 1: arquivo de origem */}
              <Badge
                variant="outline"
                className="text-xs mb-2 max-w-full"
                style={{ display: 'inline-flex' }}
              >
                📁 {mode.sourceFile || 'arquivo desconhecido'}
              </Badge>

              {/* Linha 2: toggle manter/descartar
                  onClick no container inteiro para área de clique maior */}
              <div
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2 cursor-pointer select-none',
                  isKept
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800',
                )}
                onClick={() => mode.onToggleKeep(entry.id, !isKept)}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    isKept
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400',
                  )}
                >
                  {isKept ? '✓ Manter esta entrada' : '✗ Descartar esta entrada'}
                </span>
                {/* Switch separado do onClick do container para evitar duplo disparo */}
                <Switch
                  id={`switch-${entry.id}`}
                  checked={isKept}
                  onCheckedChange={(checked) => {
                    // stopPropagation para não disparar o onClick do div pai
                    mode.onToggleKeep(entry.id, checked)
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {(mode.view === 'merged' ||
            mode.view === 'search' ||
            mode.view === 'validation') && (
            <div className="flex w-full justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => mode.onRemove(entry.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>
          )}
        </CardFooter>
      </Collapsible>
    </Card>
  )
}
