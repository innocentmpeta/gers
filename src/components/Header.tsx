import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../lib/auth'
import { useHeroOverlay } from '../lib/heroOverlay'

const NAV_ITEMS = [
  { to: '/about', label: 'About' },
  { to: '/event-overview', label: 'Event Overview' },
  { to: '/programme', label: 'Programme' },
  { to: '/speakers', label: 'Speakers' },
  { to: '/exhibition', label: 'Exhibition' },
  { to: '/student-track', label: 'Student Track' },
  { to: '/past-symposiums', label: 'Past Symposiums' },
  { to: '/faq', label: 'FAQ' },
]

const SCROLL_THRESHOLD = 40

export default function Header() {
  const { firebaseUser, profile } = useAuth()
  const { hasHero } = useHeroOverlay()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Overlay = floating over a hero image/banner. Only viable when the page
  // actually opens with a dark hero — otherwise (plain content pages, or
  // once scrolled past the hero) it falls back to the solid bar. The solid
  // bar itself stays semi-transparent (not opaque) so scrolled content keeps
  // reading as "behind glass" rather than the nav becoming a flat panel.
  const overlay = hasHero && !scrolled

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-50 pt-10 transition-[background-color,border-color] duration-300',
        overlay
          ? 'border-b border-gold-500/40 bg-gold-500/10'
          : 'border-b border-gold-600/30 bg-gold-500/90 backdrop-blur-md'
      )}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-[1800px] items-center gap-8 px-[5%]">
        <NavLink
          to="/"
          className={clsx(
            'font-display text-lg font-semibold shrink-0',
            overlay ? 'text-sand-50' : 'text-ink-900'
          )}
        >
          GERS
        </NavLink>

        <nav className="hidden lg:flex ml-[3%] items-center gap-5 text-lg text-sand-100">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'group relative py-1 text-sand-100 transition-colors hover:text-sand-50',
                  isActive && 'text-sand-50 font-medium'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    className={clsx(
                      'pointer-events-none absolute -bottom-0.5 left-0 h-[2px] w-full origin-left scale-x-0 bg-gold-500 transition-transform duration-200 group-hover:scale-x-100',
                      isActive && 'scale-x-100'
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          {profile?.systemRole && (
            <NavLink
              to="/admin"
              className="hidden sm:inline-flex items-center rounded-full bg-ink-800 px-3 py-1.5 text-sm text-sand-50 ring-1 ring-inset ring-sand-50/40 hover:bg-ink-700 transition-colors"
            >
              Admin
            </NavLink>
          )}
          <NavLink
            to={firebaseUser ? '/account' : '/login'}
            className={clsx(
              'hidden sm:inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors',
              overlay
                ? 'border-sand-50 text-sand-50 hover:bg-sand-50 hover:text-ink-900'
                : 'border-ink-800 text-ink-800 hover:bg-ink-800 hover:text-sand-50'
            )}
          >
            {firebaseUser ? 'My Account' : 'Log In'}
          </NavLink>
          <NavLink
            to="/register"
            className={clsx(
              'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              overlay
                ? 'bg-gold-500 text-sand-50 hover:bg-gold-600'
                : 'bg-ink-900 text-gold-500 hover:bg-ink-800'
            )}
          >
            Register
          </NavLink>
        </div>
      </div>
    </header>
  )
}
