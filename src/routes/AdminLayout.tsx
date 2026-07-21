import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/content', label: 'Content' },
  { to: '/admin/programme', label: 'Programme' },
  { to: '/admin/speakers', label: 'Speakers' },
  { to: '/admin/registrations', label: 'Registrations' },
  { to: '/admin/prompts', label: 'Prompts & Q&A' },
  { to: '/admin/export', label: 'Export' },
  { to: '/admin/accounts', label: 'Accounts & Roles' },
]

// Deliberately a different shell from PublicLayout — own nav, own look —
// per GERS_Functional_Requirements.docx §12: admin is a distinct interface,
// not woven into the public site chrome.
export default function AdminLayout() {
  return (
    <div className="flex min-h-svh bg-sand-100">
      <aside className="w-60 shrink-0 border-r border-sand-200 bg-teal-950 text-sand-100">
        <div className="px-5 py-6">
          <p className="font-display text-lg text-sand-50">GERS Admin</p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'rounded-md px-3 py-2 text-sm transition-colors hover:bg-teal-800',
                  isActive ? 'bg-teal-800 text-sand-50' : 'text-slate-300'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
