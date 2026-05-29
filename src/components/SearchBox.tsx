import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export const SearchBox = ({ value, onChange, disabled }: SearchBoxProps) => {
  return (
    <div className="relative w-full">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar por título, autor, ano ou palavra-chave..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
        disabled={disabled}
      />
    </div>
  )
}
