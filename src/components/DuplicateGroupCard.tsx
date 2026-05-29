import { DuplicateGroup } from '@/types'
import { EntryCard } from './EntryCard'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface DuplicateGroupCardProps {
  group: DuplicateGroup
  keptEntryIds: Set<string>
  onSelectionChange: (entryId: string, keep: boolean) => void
}

export const DuplicateGroupCard = ({
  group,
  keptEntryIds,
  onSelectionChange,
}: DuplicateGroupCardProps) => {
  // Conta quantas entradas estão marcadas para manter
  const keptCount = group.entries.filter((e) => keptEntryIds.has(e.id)).length

  // Título do grupo: usa o título da entrada com mais campos, ou a chave
  const bestEntry = group.entries.reduce((prev, cur) =>
    Object.keys(cur.fields).length > Object.keys(prev.fields).length ? cur : prev,
  )
  const groupTitle = bestEntry.fields.title || bestEntry.key

  return (
    // CORREÇÃO: removido bg-secondary que criava contraste confuso.
    // Borda colorida indica o estado do grupo (verde = pelo menos 1 mantido,
    // vermelho = nenhum marcado para manter — situação de atenção).
    <Card className={`mb-4 ${keptCount === 0 ? 'border-destructive/60' : 'border-primary/30'}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-snug flex-1 min-w-0">
            <span className="text-muted-foreground font-normal">Duplicata: </span>
            <span className="break-words">{groupTitle}</span>
          </CardTitle>
          {/* Badge mostrando quantas entradas estão marcadas para manter */}
          <Badge
            variant={keptCount === 0 ? 'destructive' : 'default'}
            className="shrink-0 text-xs"
          >
            {keptCount}/{group.entries.length} mantidas
          </Badge>
        </div>
        {keptCount === 0 && (
          <p className="text-xs text-destructive mt-1">
            ⚠️ Nenhuma entrada marcada para manter — todas serão descartadas.
          </p>
        )}
      </CardHeader>

      {/* CORREÇÃO: padding reduzido e space-y menor para o card não ficar grande demais */}
      <CardContent className="px-4 pb-4 space-y-2">
        {group.entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            mode={{
              view: 'duplicates',
              sourceFile: entry.sourceFile,
              isKept: keptEntryIds.has(entry.id),
              onToggleKeep: onSelectionChange,
            }}
          />
        ))}
      </CardContent>
    </Card>
  )
}
