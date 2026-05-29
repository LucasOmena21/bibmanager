import { BibEntry, BibFile, DuplicateGroup, BibStats, TexFilterOptions, SortOptions } from '@/types'

// Extrai ano válido (1000–2099) de campos como year ou date,
// ignorando textos malformados como "accessed: 08.10.2021"
export const extractYear = (entry: BibEntry): string => {
  const raw = entry.fields['year'] ?? entry.fields['date'] ?? ''
  const match = raw.match(/\b(1\d{3}|20\d{2})\b/)
  return match ? match[1] : ''
}

// Converte comandos LaTeX de acento para caracteres Unicode.
// Cobre: agudo, grave, circunflexo, trema, til, cedilha, háček, eszett,
// anel (å), barrado (ø/Ø), ligaduras (æ/œ) e chaves duplas {{texto}}.
// Converte comandos LaTeX de acento para Unicode.
// Usa regex para cobrir AMBOS os formatos usados em arquivos .bib:
//   Formato com chaves: {\'a}  (BibTeX clássico, Google Scholar)
//   Formato sem chaves: \'a    (DBLP, Zotero)
// A regex \{? torna a chave externa opcional, cobrindo os dois casos.
// Converte comandos LaTeX de acento para Unicode.
// Cobre três formatos encontrados em arquivos .bib reais:
//   {\'{a}}  — chaves duplas aninhadas (DBLP)
//   {\'a}   — chaves externas sem chave interna (Scholar, JabRef)
//   \'a     — sem chaves (alguns exportadores)
const ACCENT_MAP: Record<string, Record<string, string>> = {
  acute:  {a:'á',e:'é',i:'í',o:'ó',u:'ú',A:'Á',E:'É',I:'Í',O:'Ó',U:'Ú',c:'ć',C:'Ć',n:'ń',N:'Ń',s:'ś',S:'Ś',z:'ź',Z:'Ź',y:'ý'},
  grave:  {a:'à',e:'è',i:'ì',o:'ò',u:'ù',A:'À',E:'È',I:'Ì',O:'Ò',U:'Ù'},
  hat:    {a:'â',e:'ê',i:'î',o:'ô',u:'û',A:'Â',E:'Ê',I:'Î',O:'Ô',U:'Û'},
  uml:    {a:'ä',e:'ë',i:'ï',o:'ö',u:'ü',A:'Ä',E:'Ë',I:'Ï',O:'Ö',U:'Ü',y:'ÿ'},
  tilde:  {a:'ã',n:'ñ',o:'õ',A:'Ã',N:'Ñ',O:'Õ'},
  caron:  {c:'č',C:'Č',s:'š',S:'Š',z:'ž',Z:'Ž',r:'ř',R:'Ř',n:'ň',N:'Ň',e:'ě',E:'Ě',d:'ď',D:'Ď',t:'ť',T:'Ť'},
  cedil:  {c:'ç',C:'Ç'},
  macron: {a:'ā',e:'ē',i:'ī',o:'ō',u:'ū',A:'Ā',E:'Ē',I:'Ī',O:'Ō',U:'Ū'},
}

const decodeLatexAccents = (value: string): string => {
  let s = value

  // Passo 0 — {\x{\i}} dotless-i: {\x{\i}} => í ì î
  s = s.replace(/\{\\'\{\\i\}\}/g, 'í')
  s = s.replace(/\{\\`\{\\i\}\}/g, 'ì')
  s = s.replace(/\{\\\^\{\\i\}\}/g, 'î')

  // Passo 1 — formato com chaves duplas aninhadas: {\'{a}}, {\~{n}}, etc.
  // Este é o formato do DBLP e deve ser tratado PRIMEIRO
  s = s.replace(/\{\\'\{([a-zA-Z])\}\}/g, (_: string, c: string) => ACCENT_MAP.acute[c] ?? c)
  s = s.replace(/\{\\`\{([a-zA-Z])\}\}/g, (_: string, c: string) => ACCENT_MAP.grave[c] ?? c)
  s = s.replace(/\{\\\^\{([a-zA-Z])\}\}/g, (_: string, c: string) => ACCENT_MAP.hat[c] ?? c)
  s = s.replace(/\{\\"\{([a-zA-Z])\}\}/g, (_: string, c: string) => ACCENT_MAP.uml[c] ?? c)
  s = s.replace(/\{\\~\{([a-zA-Z])\}\}/g, (_: string, c: string) => ACCENT_MAP.tilde[c] ?? c)
  s = s.replace(/\{\\v\{([a-zA-Z])\}\}/g, (_: string, c: string) => ACCENT_MAP.caron[c] ?? c)
  s = s.replace(/\{\\c\{([a-zA-Z])\}\}/g, (_: string, c: string) => ACCENT_MAP.cedil[c] ?? c)
  s = s.replace(/\{\\=\{([a-zA-Z])\}\}/g, (_: string, c: string) => ACCENT_MAP.macron[c] ?? c)

  // Passo 2 — formato com chaves externas: {\'a}, {\~a}, etc.
  s = s.replace(/\{\\'\s*([a-zA-Z])\}/g, (_: string, c: string) => ACCENT_MAP.acute[c] ?? c)
  s = s.replace(/\{\\`\s*([a-zA-Z])\}/g, (_: string, c: string) => ACCENT_MAP.grave[c] ?? c)
  s = s.replace(/\{\\\^\s*([a-zA-Z])\}/g, (_: string, c: string) => ACCENT_MAP.hat[c] ?? c)
  s = s.replace(/\{\\"\s*([a-zA-Z])\}/g, (_: string, c: string) => ACCENT_MAP.uml[c] ?? c)
  s = s.replace(/\{\\~\s*([a-zA-Z])\}/g, (_: string, c: string) => ACCENT_MAP.tilde[c] ?? c)
  s = s.replace(/\{\\v\s*([a-zA-Z])\}/g, (_: string, c: string) => ACCENT_MAP.caron[c] ?? c)
  s = s.replace(/\{\\c\s*([a-zA-Z])\}/g, (_: string, c: string) => ACCENT_MAP.cedil[c] ?? c)
  s = s.replace(/\{\\=\s*([a-zA-Z])\}/g, (_: string, c: string) => ACCENT_MAP.macron[c] ?? c)

  // Passo 3 — formato sem chaves: \'a, \~n, etc.
  // Lookbehind evita converter possessivos ingleses (y's → y's, não y'ś)
  s = s.replace(/(?<![a-zA-Z])\\'\s*([a-zA-Z])/g, (_: string, c: string) => ACCENT_MAP.acute[c] ?? c)
  s = s.replace(/\\`\s*([a-zA-Z])/g, (_: string, c: string) => ACCENT_MAP.grave[c] ?? c)
  s = s.replace(/\\\^\s*([a-zA-Z])/g, (_: string, c: string) => ACCENT_MAP.hat[c] ?? c)
  s = s.replace(/\\"\s*([a-zA-Z])/g, (_: string, c: string) => ACCENT_MAP.uml[c] ?? c)
  s = s.replace(/\\~\s*([a-zA-Z])/g, (_: string, c: string) => ACCENT_MAP.tilde[c] ?? c)

  // Passo 4 — especiais
  s = s.replace(/\{?\\ss\}?/g, 'ß')
  s = s.replace(/\{?\\o\}?/g, 'ø').replace(/\{?\\O\}?/g, 'Ø')
  s = s.replace(/\{?\\ae\}?/g, 'æ').replace(/\{?\\AE\}?/g, 'Æ')
  s = s.replace(/\{?\\oe\}?/g, 'œ').replace(/\{?\\OE\}?/g, 'Œ')
  s = s.replace(/\{?\\aa\}?/g, 'å').replace(/\{?\\AA\}?/g, 'Å')

  // Passo 5 — remove chaves remanescentes
  s = s.replace(/\{\{([^{}]*)\}\}/g, '$1')
  s = s.replace(/\{([^{}]*)\}/g, '$1')
  return s
}

// A simplified BibTeX parser.
export const parseBibFile = (content: string, fileName: string): BibEntry[] => {
  const entries: BibEntry[] = []
  const bibs = content.split('@').slice(1)
  let i = 0

  for (const bib of bibs) {
    const entryContent = bib.trim()
    if (!entryContent) continue

    try {
      const typeMatch = entryContent.match(/^(\w+)/)
      if (!typeMatch) continue
      const type = typeMatch[1].toLowerCase()

      const braceStart = entryContent.indexOf('{')
      const braceEnd = entryContent.lastIndexOf('}')
      if (braceStart === -1 || braceEnd === -1) continue

      const body = entryContent.substring(braceStart + 1, braceEnd)
      const commaIndex = body.indexOf(',')
      if (commaIndex === -1) continue

      const key = body.substring(0, commaIndex).trim()
      const fieldsStr = body.substring(commaIndex + 1)

      const fields: Record<string, string> = {}

      // Extrai campos com suporte a aninhamento arbitrário de chaves.
      // O regex simples (?:[^{}]|\{[^{}]*\})* só suporta 1 nível, quebrando
      // em entradas com {{Merge}} ou Le{\ss}enich (2 níveis de chaves).
      // A função extractBraceValue percorre caractere a caractere contando
      // profundidade de chaves, resolvendo qualquer nível de aninhamento.
      const extractBraceValue = (str: string, start: number): [string, number] => {
        let depth = 0
        let i = start
        let value = ''
        while (i < str.length) {
          const ch = str[i]
          if (ch === '{') {
            depth++
            if (depth > 1) value += ch  // inclui chaves internas no valor
          } else if (ch === '}') {
            depth--
            if (depth === 0) return [value, i + 1]
            value += ch
          } else {
            value += ch
          }
          i++
        }
        return [value, i]
      }

      // Parser de campos: percorre fieldsStr procurando padrão fieldName = value
      let pos = 0
      while (pos < fieldsStr.length) {
        // Avança espaços e vírgulas
        while (pos < fieldsStr.length && /[\s,]/.test(fieldsStr[pos])) pos++
        if (pos >= fieldsStr.length) break

        // Captura nome do campo (letras/números/underscore)
        const nameMatch = fieldsStr.slice(pos).match(/^([\w]+)\s*=\s*/)
        if (!nameMatch) { pos++; continue }

        const fieldName = nameMatch[1].toLowerCase()
        pos += nameMatch[0].length

        let fieldValue = ''

        if (fieldsStr[pos] === '{') {
          // Valor entre chaves — usa extrator que respeita aninhamento
          const [val, nextPos] = extractBraceValue(fieldsStr, pos)
          fieldValue = val
          pos = nextPos
        } else if (fieldsStr[pos] === '"') {
          // Valor entre aspas
          pos++
          while (pos < fieldsStr.length && fieldsStr[pos] !== '"') {
            if (fieldsStr[pos] === '\\') pos++ // escapa próximo char
            fieldValue += fieldsStr[pos]
            pos++
          }
          pos++ // fecha aspas
        } else {
          // Valor literal (número ou abreviação @string)
          const litMatch = fieldsStr.slice(pos).match(/^([\w\d]+)/)
          if (litMatch) {
            fieldValue = litMatch[1]
            pos += litMatch[1].length
          }
        }

        if (fieldName) {
          const raw_val = fieldValue.replace(/\s+/g, ' ').trim()
          fields[fieldName] = decodeLatexAccents(raw_val)
        }
      }

      // Detecta acentos LaTeX nos valores originais (antes da decodificação)
      const hadLatexAccents = Object.values(fields).some(
        (v) => /\{\\['`^"~cvs]|\{\\ss\}/.test(v)
      ) || /\{\\['`^"~cvs]|\{\\ss\}/.test(entryContent)

      entries.push({
        id: `${fileName}-entry-${i++}`,
        key,
        type,
        fields,
        raw: `@${entryContent}`,
        sourceFile: fileName,
        hadLatexAccents,
      })
    } catch (error) {
      console.error('Error parsing BibTeX entry:', error)
    }
  }
  return entries
}

// Encontra entradas duplicadas usando chave composta título+ano (ou DOI quando disponível).
// Usar só o título causava falsos positivos: obras distintas com mesmo nome
// mas anos diferentes (ex: livro original 1974 vs capítulo 2020) eram agrupadas.
// A chave composta título+ano reduz drasticamente os falsos positivos sem
// perder duplicatas reais (que têm título E ano iguais).
export const findDuplicates = (files: BibFile[]): DuplicateGroup[] => {
  const allEntries = files.flatMap((file) => file.entries)
  const map = new Map<string, BibEntry[]>()

  allEntries.forEach((entry) => {
    const doi   = entry.fields.doi?.toLowerCase().trim()
    const title = entry.fields.title?.toLowerCase().replace(/\s+/g, ' ').trim()
    const year  = entry.fields.year?.trim() ?? ''

    let key = ''

    if (doi) {
      // DOI é identificador único — match exato sem precisar de ano
      key = `doi:${doi}`
    } else if (title) {
      // Chave composta título + ano: evita agrupar obras distintas com mesmo nome
      // Se não houver ano, usa só o título (melhor do que não agrupar nada)
      key = year ? `title+year:${title}::${year}` : `title:${title}`
    } else {
      // Fallback: chave BibTeX (só agrupa se a mesma chave aparece em arquivos diferentes)
      key = `key:${entry.key}`
    }

    if (!map.has(key)) map.set(key, [])
    map.get(key)?.push(entry)
  })

  const duplicateGroups: DuplicateGroup[] = []
  let groupId = 0
  map.forEach((entries) => {
    if (entries.length > 1) {
      duplicateGroups.push({ id: `group-${groupId++}`, entries })
    }
  })

  return duplicateGroups
}

// Combines entries from multiple files and removes duplicates automatically.
// Keeps the entry with the most fields.
export const mergeAndDeduplicate = (files: BibFile[]): BibEntry[] => {
  const groups = findDuplicates(files)
  const allEntries = files.flatMap((file) => file.entries)
  const processedIds = new Set<string>()
  const finalEntries: BibEntry[] = []

  // Process duplicates first
  groups.forEach((group) => {
    // Pick the best entry: the one with the most fields
    const bestEntry = group.entries.reduce((prev, current) => {
      return Object.keys(current.fields).length >
        Object.keys(prev.fields).length
        ? current
        : prev
    })
    finalEntries.push(bestEntry)
    group.entries.forEach((e) => processedIds.add(e.id))
  })

  // Add remaining non-duplicate entries
  allEntries.forEach((entry) => {
    if (!processedIds.has(entry.id)) {
      finalEntries.push(entry)
    }
  })

  return finalEntries
}

// Validates entries based on their type
export const validateEntries = (entries: BibEntry[]): BibEntry[] => {
  const requiredFields: Record<string, string[]> = {
    article: ['author', 'title', 'journal', 'year'],
    book: ['author', 'title', 'publisher', 'year'],
    inproceedings: ['author', 'title', 'booktitle', 'year'],
    misc: [],
    phdthesis: ['author', 'title', 'school', 'year'],
    techreport: ['author', 'title', 'institution', 'year'],
  }

  return entries.map((entry) => {
    const required = requiredFields[entry.type] || ['author', 'title', 'year'] // Default fallback
    const errors: string[] = []

    required.forEach((field) => {
      if (!entry.fields[field]) {
        errors.push(`Campo obrigatório ausente: ${field}`)
      }
    })

    return {
      ...entry,
      validationErrors: errors.length > 0 ? errors : undefined,
    }
  })
}

export const calculateStats = (files: BibFile[]): BibStats => {
  const allEntries = files.flatMap((f) => f.entries)
  const duplicates = findDuplicates(files)
  const validated = validateEntries(allEntries)

  const entryTypes: Record<string, number> = {}
  allEntries.forEach((e) => {
    entryTypes[e.type] = (entryTypes[e.type] || 0) + 1
  })

  return {
    totalEntries: allEntries.length,
    duplicateGroups: duplicates.length,
    fileCount: files.length,
    entryTypes,
    entriesWithErrors: validated.filter(
      (e) => e.validationErrors && e.validationErrors.length > 0,
    ).length,
  }
}

// Generates a .bib file string from a list of entries.
export const generateBibString = (entries: BibEntry[]): string => {
  return entries.map((entry) => entry.raw).join('\n\n')
}

// Gera URL de busca no Google Scholar a partir do título da entrada.
// Centralizado aqui para manter lógica de URL fora dos componentes React.
// Gera .bib com acentos LaTeX convertidos para Unicode nos campos de texto.
// O arquivo resultante é mais legível em editores e sistemas que não processam
// LaTeX, mas pode não ser compatível com compiladores LaTeX antigos (pre-UTF8).
export const generateNormalizedBibString = (entries: BibEntry[]): string => {
  return entries
    .map((e) => {
      // Substitui os campos de texto no raw preservando a estrutura BibTeX
      let raw = e.raw
      // Campos onde a normalização de acentos faz sentido
      const textFields = ['author', 'editor', 'title', 'booktitle', 'journal',
                          'publisher', 'address', 'series', 'note', 'abstract']
      textFields.forEach((field) => {
        if (e.fields[field]) {
          // Substitui o valor original pelo valor decodificado no raw
          const decoded = e.fields[field]
          const original = Object.entries(e.fields).find(([k]) => k === field)
          if (original && decoded !== original[1]) {
            // O campo já está decodificado em e.fields — só precisamos garantir
            // que o raw também reflete isso. Como o raw é o original, fazemos
            // uma substituição cuidadosa apenas dos padrões LaTeX conhecidos.
          }
        }
      })
      // Aplica decodeLatexAccents diretamente no raw para normalizar tudo
      return decodeLatexAccents(e.raw)
    })
    .join('\n\n')
}

export const googleScholarUrl = (entry: BibEntry): string => {
  const title = entry.fields['title'] ?? entry.key
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`
}

// ─── filterByTexFiles ─────────────────────────────────────────────────────────

function extractCitedKeys(texContent: string, commands: string[]): Set<string> {
  const keys = new Set<string>()
  const escapedCmds = commands.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(
    `\\\\(?:${escapedCmds.join('|')})(?:\\[[^\\]]*\\])?\\{([^}]+)\\}`,
    'g',
  )
  let match: RegExpExecArray | null
  while ((match = pattern.exec(texContent)) !== null) {
    match[1].split(',').forEach((k) => {
      const trimmed = k.trim()
      if (trimmed) keys.add(trimmed)
    })
  }
  return keys
}

export const filterByTexFiles = (
  files: BibFile[],
  options: TexFilterOptions,
): { filtered: BibEntry[]; missingKeys: string[] } => {
  const { citationCommands, texFiles } = options
  const allCitedKeys = new Set<string>()
  texFiles.forEach((tf) =>
    extractCitedKeys(tf.content, citationCommands).forEach((k) => allCitedKeys.add(k)),
  )
  const allEntries = files.flatMap((f) => f.entries)
  const entryMap = new Map(allEntries.map((e) => [e.key, e]))
  const filtered: BibEntry[] = []
  const missingKeys: string[] = []
  allCitedKeys.forEach((key) => {
    const entry = entryMap.get(key)
    if (entry) filtered.push(entry)
    else missingKeys.push(key)
  })
  return { filtered, missingKeys }
}

// ─── sortEntries ─────────────────────────────────────────────────────────────

export const sortEntries = (entries: BibEntry[], options: SortOptions): BibEntry[] => {
  const { field, direction } = options
  const getValue = (entry: BibEntry): string => {
    if (field === 'key') return entry.key
    if (field === 'author') {
      const a = entry.fields['author'] ?? ''
      return a.split(' and ')[0].trim().toLowerCase()
    }
    return (entry.fields[field] ?? '').toLowerCase()
  }
  return [...entries].sort((a, b) => {
    const cmp = getValue(a).localeCompare(getValue(b), 'pt-BR', { numeric: field === 'year' })
    return direction === 'asc' ? cmp : -cmp
  })
}

// ─── exportABNT ──────────────────────────────────────────────────────────────

function formatAuthorsABNT(authorField: string): string {
  if (!authorField) return ''
  const authors = authorField.split(/\s+and\s+/i).map((a) => a.trim())
  if (authors.length > 3) return formatSingleAuthorABNT(authors[0]) + ' et al.'
  return authors.map(formatSingleAuthorABNT).join('; ')
}

function formatSingleAuthorABNT(author: string): string {
  if (author.includes(',')) {
    const [last, first] = author.split(',').map((s) => s.trim())
    return `${last.toUpperCase()}, ${first}`
  }
  const parts = author.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].toUpperCase()
  const last = parts[parts.length - 1]
  const first = parts.slice(0, -1).join(' ')
  return `${last.toUpperCase()}, ${first}`
}

function abntArticle(e: BibEntry): string {
  const author = formatAuthorsABNT(e.fields['author'] ?? '')
  const title = e.fields['title'] ?? ''
  const journal = e.fields['journal'] ?? e.fields['journaltitle'] ?? ''
  const volume = e.fields['volume'] ? `v. ${e.fields['volume']}` : ''
  const number = e.fields['number'] ? `n. ${e.fields['number']}` : ''
  const pages = e.fields['pages'] ? `p. ${e.fields['pages'].replace('--', '-')}` : ''
  const year = e.fields['year'] ?? ''
  const doi = e.fields['doi'] ? ` DOI: ${e.fields['doi']}.` : ''
  const location = [volume, number, pages].filter(Boolean).join(', ')
  return `${author}. ${title}. ${journal}, ${location}, ${year}.${doi}`
}

function abntInproceedings(e: BibEntry): string {
  const author = formatAuthorsABNT(e.fields['author'] ?? '')
  const title = e.fields['title'] ?? ''
  const booktitle = e.fields['booktitle'] ?? ''
  const year = e.fields['year'] ?? ''
  const address = e.fields['address'] ?? ''
  const pages = e.fields['pages'] ? `p. ${e.fields['pages'].replace('--', '-')}` : ''
  return `${author}. ${title}. In: ${booktitle.toUpperCase()}, ${year}, ${address}. Anais [...]. ${address}: [s.n.], ${year}. ${pages}`
}

function abntBook(e: BibEntry): string {
  const author = formatAuthorsABNT(e.fields['author'] ?? e.fields['editor'] ?? '')
  const title = e.fields['title'] ?? ''
  const edition = e.fields['edition'] ? `${e.fields['edition']}. ed. ` : ''
  const address = e.fields['address'] ?? '[S.l.]'
  const publisher = e.fields['publisher'] ?? '[s.n.]'
  const year = e.fields['year'] ?? ''
  return `${author}. ${title}. ${edition}${address}: ${publisher}, ${year}.`
}

function abntMisc(e: BibEntry): string {
  const author = formatAuthorsABNT(e.fields['author'] ?? '')
  const title = e.fields['title'] ?? ''
  const year = e.fields['year'] ?? ''
  const url = e.fields['url'] ? ` Disponível em: ${e.fields['url']}.` : ''
  const urldate = e.fields['urldate'] ? ` Acesso em: ${e.fields['urldate']}.` : ''
  return `${author}. ${title}. ${year}.${url}${urldate}`
}

export const exportABNT = (entries: BibEntry[]): string => {
  return entries
    .map((e) => {
      switch (e.type.toLowerCase()) {
        case 'article': return abntArticle(e)
        case 'inproceedings':
        case 'conference': return abntInproceedings(e)
        case 'book':
        case 'incollection': return abntBook(e)
        default: return abntMisc(e)
      }
    })
    .join('\n\n')
}
