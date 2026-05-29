import { BibStats } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Copy, AlertTriangle, Files, Languages } from 'lucide-react'

interface StatsGridProps {
  stats: BibStats
  latexAccentCount?: number
}

export const StatsGrid = ({ stats, latexAccentCount = 0 }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Entradas
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEntries}</div>
          <p className="text-xs text-muted-foreground">
            Em {stats.fileCount} arquivo(s)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Duplicatas</CardTitle>
          <Copy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.duplicateGroups}</div>
          <p className="text-xs text-muted-foreground">
            Grupos de duplicatas encontrados
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Problemas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.entriesWithErrors}</div>
          <p className="text-xs text-muted-foreground">
            Entradas com campos ausentes
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tipos</CardTitle>
          <Files className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Object.keys(stats.entryTypes).length}
          </div>
          <p className="text-xs text-muted-foreground">
            Tipos diferentes de referências
          </p>
        </CardContent>
      </Card>
      {latexAccentCount > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Acentos LaTeX
            </CardTitle>
            <Languages className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {latexAccentCount}
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Entrada(s) com acentos LaTeX — normalizados automaticamente
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
