import { BibFile } from '@/types'
import { FileCard } from './FileCard'
import { Button } from './ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface UploadedFilesListProps {
  files: BibFile[]
  selectedFileIds: Set<string>
  onFileSelect: (id: string) => void
  onFileRemove: (id: string) => void
  onRemoveAll: () => void
}

export const UploadedFilesList = ({
  files,
  selectedFileIds,
  onFileSelect,
  onFileRemove,
  onRemoveAll,
}: UploadedFilesListProps) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p>Nenhum arquivo .bib carregado ainda.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Remover Todos
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso removerá permanentemente
                todos os arquivos carregados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onRemoveAll}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="space-y-3">
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            isSelected={selectedFileIds.has(file.id)}
            onSelect={onFileSelect}
            onRemove={onFileRemove}
          />
        ))}
      </div>
    </div>
  )
}
