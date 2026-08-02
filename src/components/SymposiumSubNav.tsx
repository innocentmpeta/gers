import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

const TABS = [
  { to: '/symposium', label: 'Overview', end: true },
  { to: '/symposium/programme', label: 'Programme' },
  { to: '/symposium/speakers', label: 'Speakers' },
  { to: '/symposium/exhibition', label: 'Exhibition' },
  { to: '/symposium/student-track', label: 'Student Track' },
]

// Cross-navigation between the pages that make up the "Symposium" nav
// section — each of those pages keeps its own hero/layout, this just sits
// directly below it so visitors can hop between them without going back
// through the top nav each time.
export default function SymposiumSubNav() {
  return (
    <div className="border-b border-sand-200 bg-sand-50">
      <nav className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-6 text-sm">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              clsx(
                'whitespace-nowrap border-b-2 py-4 transition-colors',
                isActive
                  ? 'border-gold-500 text-ink-900 font-medium'
                  : 'border-transparent text-slate-500 hover:text-ink-800'
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
