import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div
        aria-hidden
        style={{
          backgroundImage: "url('/uffback.png')",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          filter: 'blur(1px)',
          opacity: 0.15,
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 20,
          pointerEvents: 'none',
        }}
      />
      <Header />
      <main className="flex-grow pt-20 md:pt-24 pb-16">
        <Outlet />

      </main>
      <Footer />
    </div>
  )
}
