import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../lib/auth'

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/content', label: 'Content' },
  { to: '/admin/media', label: 'Media' },
  { to: '/admin/programme', label: 'Programme' },
  { to: '/admin/speakers', label: 'Speakers' },
  { to: '/admin/partners', label: 'Partners' },
  { to: '/admin/registrations', label: 'Registrations' },
  { to: '/admin/abstracts', label: 'Abstracts' },
  { to: '/admin/prompts', label: 'Prompts & Q&A' },
  { to: '/admin/export', label: 'Export' },
  { to: '/admin/accounts', label: 'Accounts & Roles' },
]

// Deliberately a different shell from PublicLayout — own nav, own look —
// per GERS_Functional_Requirements.docx §12: admin is a distinct interface,
// not woven into the public site chrome.
export default function AdminLayout() {
  const { logOut } = useAuth()
  const navigate = useNavigate()

  // Navigate out of the /admin route tree *before* actually signing out —
  // otherwise RequireRole (still mounted, guarding this tree) reacts to
  // firebaseUser going null and redirects to /login, racing this navigate('/')
  // and usually winning.
  async function handleLogOut() {
    navigate('/')
    await logOut()
  }

  return (
    <div className="flex min-h-svh bg-sand-100">
      <aside className="flex w-60 shrink-0 flex-col border-r border-sand-200 bg-ink-950 text-sand-100">
        <div className="px-5 py-6">
          <p className="font-display text-lg text-sand-50">GERS Admin</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'rounded-md px-3 py-2 text-sm transition-colors hover:bg-ink-800',
                  isActive ? 'bg-ink-800 text-sand-50' : 'text-slate-300'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t border-ink-800 px-3 py-3">
          <Link
            to="/"
            className="rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-ink-800"
          >
            ← View public site
          </Link>
          <button
            onClick={handleLogOut}
            className="rounded-md px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-ink-800"
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
