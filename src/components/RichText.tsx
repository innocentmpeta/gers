import { Fragment } from 'react'

// Shown under any textarea whose text passes through <RichText> on the
// public site, so content managers know the syntax exists at the point
// they'd use it.
export const RICH_TEXT_HINT = 'Tip: type <br> for a line break and <li> for a bullet point, right where you want them.'

// Content managers write plain text in a <textarea> with no formatting
// controls, so line breaks and bullets need an explicit, literal way to be
// requested — not real HTML (never trust CMS text as markup) and not tag
// *pairs* (nothing to close), just an instruction dropped at the exact spot
// it applies: "<br>" inserts a line break, "<li>" inserts a bullet marker.
// A real newline in the textarea works the same as typing "<br>" — CSS alone
// (white-space) can't add bullets, which is the actual reason this exists
// rather than just switching the containing element to whitespace-pre-line.
export default function RichText({ text }: { text: string }) {
  const parts = text.split(/(<br>|<li>|\n)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part === '<br>' || part === '\n') return <br key={i} />
        if (part === '<li>') return <Fragment key={i}>{'• '}</Fragment>
        return part ? <Fragment key={i}>{part}</Fragment> : null
      })}
    </>
  )
}
