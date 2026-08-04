import { Outlet } from 'react-router-dom'
import clsx from 'clsx'
import PartnerLogosBanner from '../components/PartnerLogosBanner'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { HeroOverlayProvider, useHeroOverlay } from '../lib/heroOverlay'

// The white logos banner is fixed above the header (which is itself
// fixed/out-of-flow so a hero image can extend behind it, offset below the
// banner rather than at the very top). Pages without a hero need top
// padding to compensate for both; pages with one only need to clear the
// banner, since the hero is meant to start right below it with the header
// floating transparently over the rest of it.
function PublicLayoutContent() {
  const { hasHero } = useHeroOverlay()
  return (
    <div className="flex min-h-svh flex-col bg-sand-50">
      <PartnerLogosBanner />
      <Header />
      <main className={clsx('flex-1', hasHero ? 'pt-20' : 'pt-[192px]')}>
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
