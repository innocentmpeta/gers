import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../lib/auth'

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

export default function Header() {
  const { firebaseUser } = useAuth()

  return (
    <header className="border-b border-sand-200 bg-sand-50/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <NavLink to="/" className="font-display text-lg font-semibold text-teal-900 shrink-0">
          GERS
        </NavLink>

        <nav className="hidden lg:flex items-center gap-5 text-sm text-slate-700">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'transition-colors hover:text-teal-900',
                  isActive && 'text-teal-900 font-medium'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <NavLink
            to={firebaseUser ? '/account' : '/login'}
            className="hidden sm:inline-flex items-center rounded-full border border-teal-800 px-3 py-1.5 text-sm text-teal-800 hover:bg-teal-800 hover:text-sand-50 transition-colors"
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
