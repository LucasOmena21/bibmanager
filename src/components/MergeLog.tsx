/**
 * MergeLog.tsx — NOVO COMPONENTE
 *
 * Exibe o log do que foi removido após o merge.
 * Cada linha mostra a entrada descartada e qual foi mantida no lugar.
 * Separado de Results para manter coesão — este componente só sabe
 * exibir um log, não sabe nada sobre BibTeX ou estado global.
 */
import { ChevronDown, ChevronUp, Trash2, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface MergeLogEntry {
  removed: { key: string; title: string; sourceFile?: string }
  keptKey: string
}

interface MergeLogProps {
  log: MergeLogEntry[]
}

export const MergeLog = ({ log }: MergeLogProps) => {
  const [open, setOpen] = useState(false)

  if (log.length === 0) return null

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 mt-4">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-800 dark:text-amber-200">
              {log.length} entrada{log.length > 1 ? 's' : ''} removida{log.length > 1 ? 's' : ''} pelo merge
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <><ChevronUp className="h-3.5 w-3.5 mr-1" /> Ocultar log</>
            ) : (
              <><ChevronDown className="h-3.5 w-3.5 mr-1" /> Ver log</>
            )}
          </Button>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="px-4 pb-4">
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {log.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs bg-background rounded-md p-2 border border-border"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-semibold text-destructive truncate">
                      {entry.removed.key}
                    </span>
                    {entry.removed.sourceFile && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {entry.removed.sourceFile}
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground truncate">
                    {entry.removed.title || '(sem título)'}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    <span>mantida: </span>
                    <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                      {entry.keptKey}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
