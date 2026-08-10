import { Fragment, useState } from 'react'
import GersIcon from './GersIcon'
import { ICON_NAMES, isIconName } from './icons'

// Content managers write plain text in a <textarea> with no formatting
// controls, so line breaks, bullets, and icons need an explicit, literal way
// to be requested — not real HTML (never trust CMS text as markup) and not
// tag *pairs* (nothing to close), just an instruction dropped at the exact
// spot it applies: "<br>" inserts a line break, "<li>" inserts a bullet
// marker, "<icon:name>" inserts one of the GERS icons (see components/icons.ts).
// A real newline in the textarea works the same as typing "<br>" — CSS alone
// (white-space) can't add bullets, which is the actual reason this exists
// rather than just switching the containing element to whitespace-pre-line.
const TOKEN_RE = /(<br>|<li>|<icon:[a-z-]+>|\n)/

export default function RichText({ text }: { text: string }) {
  const parts = text.split(TOKEN_RE)
  return (
    <>
      {parts.map((part, i) => {
        if (part === '<br>' || part === '\n') return <br key={i} />
        if (part === '<li>') return <Fragment key={i}>{'• '}</Fragment>
        const iconMatch = part.match(/^<icon:([a-z-]+)>$/)
        if (iconMatch && isIconName(iconMatch[1])) {
          return (
            <GersIcon
              key={i}
              name={iconMatch[1]}
              className="mx-0.5 inline-block h-[1em] w-[1em] align-[-0.15em]"
            />
          )
        }
        return part ? <Fragment key={i}>{part}</Fragment> : null
      })}
    </>
  )
}

// Shown under any textarea whose text passes through <RichText> on the
// public site, so content managers know the syntax exists at the point
// they'd use it — including a click-to-expand legend of icon names, since
// nobody can be expected to memorise 20+ names from a hint line alone.
export function RichTextHint() {
  const [open, setOpen] = useState(false)
  return (
    <div className="text-xs text-slate-400">
      <p>
        Tip: type <code className="text-slate-500">&lt;br&gt;</code> for a line break,{' '}
        <code className="text-slate-500">&lt;li&gt;</code> for a bullet point, and{' '}
        <code className="text-slate-500">&lt;icon:name&gt;</code> for an icon (e.g.{' '}
        <code className="text-slate-500">&lt;icon:leaf&gt;</code>) — right where you want them.{' '}
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-ink-700 underline">
          {open ? 'Hide icons' : 'See available icons'}
        </button>
      </p>
      {open && (
        <div className="mt-2 grid grid-cols-4 gap-2 rounded-md border border-sand-200 bg-white p-3 sm:grid-cols-6">
          {ICON_NAMES.map((name) => (
            <div key={name} className="flex flex-col items-center gap-1 rounded p-1 text-center">
              <GersIcon name={name} className="h-6 w-6 text-ink-800" />
              <span className="break-all text-[10px] text-slate-500">{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
