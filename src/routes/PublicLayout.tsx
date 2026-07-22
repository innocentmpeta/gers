import { Outlet } from 'react-router-dom'
import clsx from 'clsx'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { HeroOverlayProvider, useHeroOverlay } from '../lib/heroOverlay'

// Header is fixed/out-of-flow so a hero image can extend behind it. Pages
// without a hero need top padding to compensate; pages with one don't, since
// the hero is meant to start at y=0 with the header floating over it.
function PublicLayoutContent() {
  const { hasHero } = useHeroOverlay()
  return (
    <div className="flex min-h-svh flex-col bg-sand-50">
      <Header />
      <main className={clsx('flex-1', !hasHero && 'pt-[112px]')}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

// Public pages and the logged-in attendee account area share this one shell —
// see GERS_Functional_Requirements.docx §12: the "My Account" entry point
// reveals attendee pages without swapping visitors into a different-looking system.
export default function PublicLayout() {
  return (
    <HeroOverlayProvider>
      <PublicLayoutContent />
    </HeroOverlayProvider>
  )
}
