import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BibEntry } from '@/types'

const COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#64748B',
]

// ── Agregação ─────────────────────────────────────────────────────────────────

function countBy(
  entries: BibEntry[],
  keyFn: (e: BibEntry) => string,
  topN?: number,
): { name: string; total: number }[] {
  const map = new Map<string, number>()
  for (const entry of entries) {
    const k = keyFn(entry)
    if (!k) continue
    map.set(k, (map.get(k) ?? 0) + 1)
  }
  const sorted = Array.from(map.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
  return topN ? sorted.slice(0, topN) : sorted
}

// Nome completo do primeiro autor (não só sobrenome)
// Normaliza nome de autor:
// "Sobrenome, Nome" → "Nome Sobrenome"
// "Nome Sobrenome" → mantém
// Remove acentos LaTeX residuais como Cl{\'{a}}udio → Cláudio
function normalizeAuthorName(raw: string): string {
  let name = raw.trim()
  // Remove comandos LaTeX de acento: {\'{a}} → á, {\~{a}} → ã, etc.
  name = name
    .replace(/\{\'\{([a-zA-Z])\}\}/g, (_, c) => ({ a:'á',e:'é',i:'í',o:'ó',u:'ú',A:'Á',E:'É',I:'Í',O:'Ó',U:'Ú' } as any)[c] ?? c)
    .replace(/\{\\`\{([a-zA-Z])\}\}/g, (_, c) => ({ a:'à',e:'è',i:'ì',o:'ò',u:'ù',A:'À',E:'È',I:'Ì',O:'Ò',U:'Ù' } as any)[c] ?? c)
    .replace(/\{\\^\{([a-zA-Z])\}\}/g, (_, c) => ({ a:'â',e:'ê',i:'î',o:'ô',u:'û',A:'Â',E:'Ê',I:'Î',O:'Ô',U:'Û' } as any)[c] ?? c)
    .replace(/\{\"\{([a-zA-Z])\}\}/g, (_, c) => ({ a:'ä',e:'ë',i:'ï',o:'ö',u:'ü',A:'Ä',E:'Ë',I:'Ï',O:'Ö',U:'Ü' } as any)[c] ?? c)
    .replace(/\{\~\{([a-zA-Z])\}\}/g, (_, c) => ({ a:'ã',n:'ñ',o:'õ',A:'Ã',N:'Ñ',O:'Õ' } as any)[c] ?? c)
    .replace(/\{\c\{([cC])\}\}/g, (_, c) => c === 'c' ? 'ç' : 'Ç')
    .replace(/\{\v\{([a-zA-Z])\}\}/g, (_, c) => ({ c:'č',C:'Č',s:'š',S:'Š',z:'ž',Z:'Ž',r:'ř',R:'Ř' } as any)[c] ?? c)
    .replace(/\{\ss\}/g, 'ß')
    // Remove chaves remanescentes
    .replace(/\{([^{}]*)\}/g, '$1')
    .trim()
  // "Sobrenome, Nome" → "Nome Sobrenome"
  if (name.includes(',')) {
    const [last, given] = name.split(',').map((s) => s.trim())
    return given ? `${given} ${last}` : last
  }
  return name
}

// Conta TODOS os autores de cada entrada (não só o primeiro)
function getAllAuthors(authorField: string): string[] {
  return authorField
    .split(/\s+and\s+/i)
    .map((a) => normalizeAuthorName(a))
    .filter(Boolean)
}

// Detecta se um campo de autores contém comandos LaTeX de acento
function hasLatexAccents(authorField: string): boolean {
  return /\{\['`^"~cvs]/.test(authorField)
}

// Extrai ano válido ignorando lixo como "accessed: 08.10.2021"
function extractYear(entry: BibEntry): string {
  const raw = entry.fields['year'] ?? entry.fields['date'] ?? ''
  const match = raw.match(/\b(1\d{3}|20\d{2})\b/)
  return match ? match[1] : ''
}

// Largura do YAxis baseada no nome mais longo
function calcYAxisWidth(data: { name: string }[]): number {
  const longest = data.reduce((max, d) => Math.max(max, d.name.length), 0)
  return Math.min(Math.max(longest * 7 + 12, 60), 240)
}

// ── CustomYTick: quebra nomes longos em múltiplas linhas ──────────────────────

const CustomYTick = ({
  x, y, payload,
}: {
  x?: number
  y?: number
  payload?: { value: string }
}) => {
  if (!payload || x === undefined || y === undefined) return null
  const name = payload.value
  const maxCharsPerLine = 30
  const words = name.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  const lineHeight = 13
  const startY = y - (lines.length * lineHeight) / 2 + lineHeight / 2
  return (
    <g>
      {lines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={startY + i * lineHeight}
          textAnchor="end"
          fontSize={10}
          fill="#6b7280"
        >
          {line}
        </text>
      ))}
    </g>
  )
}

// ── Tooltip customizado para o gráfico de tipos ───────────────────────────────

const TypeTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const { name, total } = payload[0].payload
  const label: Record<string, string> = {
    article: 'Artigo de periódico — maior peso na avaliação da pós-graduação (CAPES/PGC-UFF)',
    inproceedings: 'Artigo em conferência/evento',
    conference: 'Artigo em conferência/evento',
    book: 'Livro',
    incollection: 'Capítulo de livro',
    phdthesis: 'Tese de doutorado',
    mastersthesis: 'Dissertação de mestrado',
    techreport: 'Relatório técnico',
    misc: 'Outro tipo',
  }
  return (
    <div className="bg-popover border border-border rounded-md shadow-md px-3 py-2 text-xs max-w-[220px]">
      <p className="font-semibold mb-1">{name} — {total} {total === 1 ? 'entrada' : 'entradas'}</p>
      <p className="text-muted-foreground leading-snug">{label[name.toLowerCase()] ?? 'Tipo de entrada BibTeX'}</p>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ReportChartsProps {
  entries: BibEntry[]
  topN?: number
}

// ── Componente ────────────────────────────────────────────────────────────────

export const ReportCharts = ({ entries, topN = 10 }: ReportChartsProps) => {
  if (entries.length === 0) return null

  // Gráfico 1 — por tipo (pizza para mostrar proporção periódico vs conferência)
  const byType = useMemo(
    () => countBy(entries, (e) => e.type.toLowerCase()),
    [entries],
  )

  // Destaque periódico vs conferência para avaliação CAPES/PGC-UFF
  const journalCount = useMemo(
    () => entries.filter((e) => e.type.toLowerCase() === 'article').length,
    [entries],
  )
  const confCount = useMemo(
    () => entries.filter((e) =>
      ['inproceedings', 'conference'].includes(e.type.toLowerCase()),
    ).length,
    [entries],
  )

  // Gráfico 2 — top autores com nome completo
  // Conta todos os autores (não só o primeiro)
  const byAuthor = useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of entries) {
      const authorField = entry.fields['author']
      if (!authorField) continue
      for (const name of getAllAuthors(authorField)) {
        map.set(name, (map.get(name) ?? 0) + 1)
      }
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, topN)
  }, [entries, topN])

  // Detecta entradas com acentos LaTeX não decodificados no campo author
  const latexAccentCount = useMemo(
    () => entries.filter((e) => e.fields['author'] && hasLatexAccents(e.fields['author'])).length,
    [entries],
  )

  // Gráfico 3 — top periódicos/eventos
  const MAX_VENUE_CHARS = 45

  // byVenue guarda nome truncado para o eixo + nome completo para tooltip
  const byVenue = useMemo(() => {
    const map = new Map<string, { total: number; fullName: string }>()
    for (const entry of entries) {
      const full = entry.fields['journal'] ?? entry.fields['booktitle'] ?? ''
      if (!full) continue
      const display = full.length > MAX_VENUE_CHARS ? full.slice(0, MAX_VENUE_CHARS) + '…' : full
      const existing = map.get(display)
      if (existing) existing.total++
      else map.set(display, { total: 1, fullName: full })
    }
    return Array.from(map.entries())
      .map(([name, { total, fullName }]) => ({ name, total, fullName }))
      .sort((a, b) => b.total - a.total)
      .slice(0, topN)
  }, [entries, topN])

  // Gráfico 4 — por ano
  const byYear = useMemo(
    () => countBy(entries, extractYear)
      .filter((d) => d.name !== '')
      .sort((a, b) => a.name.localeCompare(b.name)),
    [entries],
  )

  const authorHeight = Math.max(byAuthor.length * 42, 220)
  const venueHeight  = Math.max(byVenue.length * 48, 220)
  const authorYWidth = calcYAxisWidth(byAuthor)
  const venueYWidth  = calcYAxisWidth(byVenue)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

      {/* ── Gráfico 1 — Artigos por Tipo (pizza) ── */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium">Artigos por Tipo</CardTitle>
          <CardDescription className="text-xs leading-snug">
            <span className="font-medium text-foreground">
              Periódicos: {journalCount}
            </span>
            {' · '}
            <span className="font-medium text-foreground">
              Conferências: {confCount}
            </span>
            {' · '}
            <a
              href="https://www.ic.uff.br/wp-content/uploads/2026/04/Criterios-de-Credenciamento-e-Habilitacao-do-PGC-UFF-Modificado-em-25_fev_2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary"
            >
              Critérios PGC-UFF
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center pb-2">
          {/* Pizza sem labels inline — Legend abaixo evita esmagamento */}
          <ResponsiveContainer width="100%" height={200}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={byType}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={false}
              >
                {byType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<TypeTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legenda manual abaixo da pizza — nome + contagem + cor */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 px-2">
            {byType.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.name} ({item.total})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Gráfico 2 — Top Autores (nome completo) ── */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium">Top {topN} Autores</CardTitle>
          <CardDescription className="text-xs">
            Todos os autores de cada entrada, por frequência. Nomes com acentos LaTeX são normalizados automaticamente.
            {latexAccentCount > 0 && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400">
                ⚠️ {latexAccentCount} entrada(s) tinham nomes com acentos LaTeX — corrigidos automaticamente.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 px-2 pb-2">
          <div style={{ width: '100%', height: authorHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byAuthor}
                layout="vertical"
                margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
              >
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={authorYWidth}
                  tick={<CustomYTick />}
                />
                <Tooltip formatter={(v: number) => [v, 'artigos']} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="total" fill={COLORS[0]} radius={[0, 4, 4, 0]}>
                  {byAuthor.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Gráfico 3 — Top Periódicos/Eventos ── */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium">
            Top {topN} Periódicos / Eventos
          </CardTitle>
          <CardDescription className="text-xs">
            Útil para identificar alvos de publicação em revisões da literatura.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 px-2 pb-2">
          <div style={{ width: '100%', height: venueHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byVenue}
                layout="vertical"
                margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
              >
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={venueYWidth}
                  tick={<CustomYTick />}
                />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div style={{ background: 'var(--color-popover,#fff)', border: '1px solid var(--color-border,#e5e7eb)', borderRadius: 6, padding: '8px 12px', fontSize: 11, maxWidth: 280 }}>
                        <p style={{ fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>{d.fullName}</p>
                        <p style={{ color: '#6b7280' }}>{d.total} artigo(s)</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="total" fill={COLORS[1]} radius={[0, 4, 4, 0]}>
                  {byVenue.map((entry, i) => (
                    <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Gráfico 4 — Publicações por Ano ── */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium">Publicações por Ano</CardTitle>
          <CardDescription className="text-xs">
            Indica a atualidade das referências. Concentração em anos recentes
            sugere revisão bibliográfica atual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div style={{ width: Math.max(byYear.length * 32, 300), height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byYear}
                  margin={{ top: 4, right: 8, left: -16, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={55}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [v, 'artigos']} cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="total" radius={[3, 3, 0, 0]}>
                    {byYear.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
