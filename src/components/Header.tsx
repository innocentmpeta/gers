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
        'fixed inset-x-0 z-50 transition-[background-color,border-color,top] duration-300',
        overlay ? 'top-10 bg-transparent' : 'top-0 border-b border-sand-200/80 bg-sand-50/75 backdrop-blur-md'
      )}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-[1800px] items-center justify-between gap-6 px-[5%]">
        <NavLink
          to="/"
          className={clsx(
            'font-display text-lg font-semibold shrink-0',
            overlay ? 'text-sand-50' : 'text-teal-900'
          )}
        >
          GERS
        </NavLink>

        <nav
          className={clsx(
            'hidden lg:flex items-center gap-5 text-base',
            overlay ? 'text-sand-100' : 'text-slate-700'
          )}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'group relative py-1 transition-colors',
                  overlay ? 'hover:text-sand-50' : 'hover:text-teal-900',
                  isActive && (overlay ? 'text-sand-50 font-medium' : 'text-teal-900 font-medium')
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    className={clsx(
                      'pointer-events-none absolute -bottom-0.5 left-0 h-[2px] w-full origin-left scale-x-0 bg-ochre-500 transition-transform duration-200 group-hover:scale-x-100',
                      isActive && 'scale-x-100'
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {profile?.systemRole && (
            <NavLink
              to="/admin"
              className="hidden sm:inline-flex items-center rounded-full bg-teal-800 px-3 py-1.5 text-sm text-sand-50 ring-1 ring-inset ring-sand-50/40 hover:bg-teal-700 transition-colors"
            >
              Admin
            </NavLink>
          )}
          <NavLink
            to={firebaseUser ? '/account' : '/login'}
            className={clsx(
              'hidden sm:inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors',
              overlay
                ? 'border-sand-50 text-sand-50 hover:bg-sand-50 hover:text-teal-900'
                : 'border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-sand-50'
            )}
          >
            {firebaseUser ? 'My Account' : 'Log In'}
          </NavLink>
          <NavLink
            to="/register"
            className="inline-flex items-center rounded-full bg-ochre-500 px-4 py-1.5 text-sm font-medium text-sand-50 hover:bg-ochre-600 transition-colors"
          >
            Register
          </NavLink>
        </div>
      </div>
    </header>
  )
}
