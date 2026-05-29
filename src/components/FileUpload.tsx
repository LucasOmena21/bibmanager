import { useState, useRef, DragEvent } from 'react'
import { UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFilesUpload: (
    files: { name: string; size: number; content: string }[],
  ) => void
  isLoading: boolean
}

export const FileUpload = ({ onFilesUpload, isLoading }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileProcessing = (files: FileList) => {
    const bibFiles = Array.from(files).filter((file) =>
      file.name.endsWith('.bib'),
    )

    if (bibFiles.length !== files.length) {
      toast({
        variant: 'destructive',
        title: 'Erro de Arquivo',
        description: 'Apenas arquivos .bib são permitidos.',
      })
    }

    if (bibFiles.length === 0) return

    const filePromises = bibFiles.map((file) => {
      return new Promise<{ name: string; size: number; content: string }>(
        (resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) =>
            resolve({
              name: file.name,
              size: file.size,
              content: e.target?.result as string,
            })
          reader.onerror = reject
          reader.readAsText(file)
        },
      )
    })

    Promise.all(filePromises).then(onFilesUpload)
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcessing(e.dataTransfer.files)
    }
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center w-full min-h-[200px] p-6 border-2 border-dashed rounded-lg transition-colors duration-200 ease-out',
        isDragging ? 'border-primary bg-primary/10' : 'border-border bg-card',
      )}
    >
      <UploadCloud
        className={cn(
          'h-12 w-12 mb-4',
          isDragging ? 'text-primary' : 'text-muted-foreground',
        )}
      />
      <p className="text-center text-muted-foreground mb-4">
        Arraste e solte seus arquivos .bib aqui ou clique para selecionar.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".bib"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileProcessing(e.target.files)}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
      >
        Selecionar Arquivos
      </Button>
    </div>
  )
}
