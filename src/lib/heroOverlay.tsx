import { createContext, useContext, useState, type ReactNode } from 'react'

interface HeroOverlayContextValue {
  hasHero: boolean
  setHasHero: (value: boolean) => void
}

const HeroOverlayContext = createContext<HeroOverlayContextValue | undefined>(undefined)

// Lets HeroBlock (deep in the page tree) tell Header/PublicLayout (siblings,
// not ancestors of it) whether the current page opens with a hero — so the
// header can float transparently over it instead of sitting in a separate bar.
export function HeroOverlayProvider({ children }: { children: ReactNode }) {
  const [hasHero, setHasHero] = useState(false)
  return (
    <HeroOverlayContext.Provider value={{ hasHero, setHasHero }}>
      {children}
    </HeroOverlayContext.Provider>
  )
}

export function useHeroOverlay(): HeroOverlayContextValue {
  const ctx = useContext(HeroOverlayContext)
  if (!ctx) throw new Error('useHeroOverlay must be used within HeroOverlayProvider')
  return ctx
}
