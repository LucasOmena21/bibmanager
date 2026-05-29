export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-subtle z-10 h-16 md:h-20">
      <div className="container mx-auto flex items-center h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img src="/UFF.png" alt="UFF logo" className="h-8 w-8 object-contain" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            Gerenciador de Arquivos .bib
          </h1>
        </div>
      </div>
    </header>
  )
}
