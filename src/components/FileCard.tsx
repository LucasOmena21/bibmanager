import { CheckCircle, X } from 'lucide-react'
import { BibFile } from '@/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'

interface FileCardProps {
  file: BibFile
  isSelected: boolean
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}

export const FileCard = ({
  file,
  isSelected,
  onSelect,
  onRemove,
}: FileCardProps) => {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  return (
    <Card className="p-4 flex items-center justify-between transition-all duration-300 ease-out hover:shadow-hover-shadow animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Checkbox
          id={`select-${file.id}`}
          checked={isSelected}
          onCheckedChange={() => onSelect(file.id)}
          aria-label={`Selecionar arquivo ${file.name}`}
        />
        <CheckCircle className="h-5 w-5 text-success" />
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{file.name}</span>
          <span className="text-sm text-muted-foreground">
            {formatBytes(file.size)}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:bg-destructive/10 rounded-full"
        onClick={() => onRemove(file.id)}
        aria-label={`Remover arquivo ${file.name}`}
      >
        <X className="h-5 w-5" />
      </Button>
    </Card>
  )
}
