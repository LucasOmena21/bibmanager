import { useRef } from 'react'
import { X, FileCode, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TexFile } from '@/types'

interface TexFileSelectorProps {
  files: TexFile[]
  commands: string[]
  onFilesChange: (files: TexFile[]) => void
  onCommandsChange: (commands: string[]) => void
}

const DEFAULT_COMMANDS = ['cite', 'textcite', 'citep', 'citet', 'autocite']

export const TexFileSelector = ({
  files,
  commands,
  onFilesChange,
  onCommandsChange,
}: TexFileSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const content = ev.target?.result as string
        onFilesChange(
          files.find((f) => f.filename === file.name)
            ? files
            : [...files, { filename: file.name, content }],
        )
      }
      reader.readAsText(file)
    })
    e.target.value = ''
  }

  const removeFile = (filename: string) =>
    onFilesChange(files.filter((f) => f.filename !== filename))

  const toggleCommand = (cmd: string) =>
    onCommandsChange(
      commands.includes(cmd)
        ? commands.filter((c) => c !== cmd)
        : [...commands, cmd],
    )

  const addCustomCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const val = (e.target as HTMLInputElement).value.trim().replace(/^\\/, '')
    if (val && !commands.includes(val)) {
      onCommandsChange([...commands, val])
      ;(e.target as HTMLInputElement).value = ''
    }
  }

  return (
    <div className="space-y-3">
      {/* Área de upload */}
      <div
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-accent/30 transition-colors"
      >
        <Upload className="h-5 w-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground text-center">
          Clique para selecionar arquivos <strong>.tex</strong>
          <br />
          <span className="text-[11px]">Pode selecionar mais de um</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".tex"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Link para baixar arquivo .tex de exemplo */}
      <div className="flex items-center justify-end">
        <a
          href="/exemplo.tex"
          download="exemplo.tex"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Download className="h-3 w-3" />
          Baixar .tex de exemplo
        </a>
      </div>

      {/* Arquivos carregados */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Arquivos selecionados</Label>
          <div className="flex flex-col gap-1.5">
            {files.map((f) => (
              <div
                key={f.filename}
                className="flex items-center gap-2 bg-secondary border border-border rounded-md px-3 py-2"
              >
                <FileCode className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-medium truncate flex-1">{f.filename}</span>
                <button
                  type="button"
                  onClick={() => removeFile(f.filename)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comandos de citação */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Comandos reconhecidos</Label>
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => toggleCommand(cmd)}
              className={`text-xs px-2 py-1 rounded-md border transition-colors font-mono ${
                commands.includes(cmd)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary'
              }`}
            >
              \{cmd}
            </button>
          ))}
        </div>
        <Input
          placeholder="Adicionar comando personalizado (Enter)"
          className="h-7 text-xs font-mono"
          onKeyDown={addCustomCommand}
        />
        {/* Comandos personalizados */}
        {commands.filter((c) => !DEFAULT_COMMANDS.includes(c)).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {commands
              .filter((c) => !DEFAULT_COMMANDS.includes(c))
              .map((cmd) => (
                <Badge key={cmd} variant="secondary" className="gap-1 text-xs font-mono">
                  \{cmd}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCommand(cmd)} />
                </Badge>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
