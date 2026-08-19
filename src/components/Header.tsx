import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../lib/auth'
import { useHeroOverlay } from '../lib/heroOverlay'

const SYMPOSIUM_ITEMS = [
  { to: '/symposium', label: 'Overview', end: true },
  { to: '/symposium/programme', label: 'Programme' },
  { to: '/symposium/speakers', label: 'Experts' },
  { to: '/symposium/exhibition', label: 'Exhibition' },
  { to: '/symposium/student-track', label: 'Student Track' },
  { to: '/symposium/partners', label: 'Partners' },
]

const NAV_ITEMS = [
  { to: '/past-symposiums', label: 'Past Symposiums' },
  { to: '/faq', label: 'FAQ' },
]

const SCROLL_THRESHOLD = 40

export default function Header() {
  const { firebaseUser, profile } = useAuth()
  const { hasHero } = useHeroOverlay()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSymposiumOpen, setMobileSymposiumOpen] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on any route change (NavLink clicks unmount/remount
  // this component's subtree via React Router, but a plain click handler on
  // each link is the simplest reliable way to collapse it immediately).
  function closeMobile() {
    setMobileOpen(false)
    setMobileSymposiumOpen(false)
  }

  // Overlay = floating over a hero image/banner. Only viable when the page
  // actually opens with a dark hero — otherwise (plain content pages, or
  // once scrolled past the hero) it falls back to the solid bar. The solid
  // bar itself stays semi-transparent (not opaque) so scrolled content keeps
  // reading as "behind glass" rather than the nav becoming a flat panel.
  // The mobile menu being open forces the solid bar too — an overlay bar
  // over a hero image is unreadable once a tall opaque panel drops below it.
  const overlay = hasHero && !scrolled && !mobileOpen

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-20 z-50 pt-10 transition-[background-color,border-color] duration-300',
        overlay
          ? 'border-b border-gold-500/40 bg-ink-950/40'
          : 'border-b border-gold-600/30 bg-gold-500/90 backdrop-blur-md'
      )}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-[1800px] items-center gap-8 px-[5%]">
        <NavLink to="/" className="shrink-0" onClick={closeMobile}>
          <img
            src={overlay ? '/logo-gold.png' : '/logo-white.png'}
            alt="GERS — Gauteng Environmental Research Symposium"
            className="-mt-2 h-[4.8rem] w-auto"
          />
        </NavLink>

        <nav className="ml-[3%] hidden items-center gap-5 text-lg text-sand-100 lg:flex">
          <NavLink
            to="/about"
            className={({ isActive }) =>
              clsx(
                'group relative py-1 text-sand-100 transition-colors hover:text-sand-50',
                isActive && 'text-sand-50 font-medium'
              )
            }
          >
            {({ isActive }) => (
              <>
                About Us
                <span
                  className={clsx(
                    'pointer-events-none absolute -bottom-0.5 left-0 h-[2px] w-full origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100',
                    overlay ? 'bg-gold-500' : 'bg-sand-50',
                    isActive && 'scale-x-100'
                  )}
                />
              </>
            )}
          </NavLink>

          <div className="group relative py-1">
            <NavLink
              to="/symposium"
              onClick={(e) => e.currentTarget.blur()}
              className={({ isActive }) =>
                clsx('text-sand-100 transition-colors hover:text-sand-50', isActive && 'text-sand-50 font-medium')
              }
            >
              Symposium
            </NavLink>
            <div className="invisible absolute left-0 top-full min-w-[200px] rounded-lg border border-gold-500/30 bg-ink-950 py-2 opacity-0 shadow-lg transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              {SYMPOSIUM_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={(e) => e.currentTarget.blur()}
                  className={({ isActive }) =>
                    clsx(
                      'block px-4 py-2 text-base text-sand-100 transition-colors hover:bg-ink-800 hover:text-sand-50',
                      isActive && 'text-gold-500'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

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
                      'pointer-events-none absolute -bottom-0.5 left-0 h-[2px] w-full origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100',
                      overlay ? 'bg-gold-500' : 'bg-sand-50',
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
              className="hidden items-center rounded-full bg-ink-800 px-3 py-1.5 text-sm text-sand-50 ring-1 ring-inset ring-sand-50/40 transition-colors hover:bg-ink-700 sm:inline-flex"
            >
              Admin
            </NavLink>
          )}
          <NavLink
            to={firebaseUser ? '/account' : '/login'}
            className={clsx(
              'hidden items-center rounded-full border px-3 py-1.5 text-sm transition-colors sm:inline-flex',
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
              'hidden items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors sm:inline-flex',
              overlay
                ? 'bg-gold-500 text-sand-50 hover:bg-gold-600'
                : 'bg-ink-900 text-gold-500 hover:bg-ink-800'
            )}
          >
            Register
          </NavLink>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className={clsx(
              'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors lg:hidden',
              overlay ? 'border-sand-50 text-sand-50' : 'border-ink-800 text-ink-800'
            )}
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100svh-192px)] overflow-y-auto border-t border-gold-600/30 bg-gold-500 lg:hidden">
          <nav className="flex flex-col px-[5%] py-4 text-ink-900">
            <NavLink to="/about" onClick={closeMobile} className="border-b border-ink-900/10 py-3">
              About Us
            </NavLink>

            <button
              type="button"
              onClick={() => setMobileSymposiumOpen((v) => !v)}
              className="flex items-center justify-between border-b border-ink-900/10 py-3 text-left"
              aria-expanded={mobileSymposiumOpen}
            >
              Symposium
              <svg
                viewBox="0 0 24 24"
                className={clsx('h-4 w-4 transition-transform', mobileSymposiumOpen && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {mobileSymposiumOpen && (
              <div className="flex flex-col border-b border-ink-900/10 pb-2 pl-4">
                {SYMPOSIUM_ITEMS.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} onClick={closeMobile} className="py-2 text-sm">
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}

            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={closeMobile} className="border-b border-ink-900/10 py-3">
                {item.label}
              </NavLink>
            ))}

            <div className="mt-4 flex flex-col gap-3">
              {profile?.systemRole && (
                <NavLink
                  to="/admin"
                  onClick={closeMobile}
                  className="inline-flex items-center justify-center rounded-full bg-ink-800 px-4 py-2 text-sm text-sand-50"
                >
                  Admin
                </NavLink>
              )}
              <NavLink
                to={firebaseUser ? '/account' : '/login'}
                onClick={closeMobile}
                className="inline-flex items-center justify-center rounded-full border border-ink-800 px-4 py-2 text-sm text-ink-800"
              >
                {firebaseUser ? 'My Account' : 'Log In'}
              </NavLink>
              <NavLink
                to="/register"
                onClick={closeMobile}
                className="inline-flex items-center justify-center rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-gold-500"
              >
                Register
              </NavLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
