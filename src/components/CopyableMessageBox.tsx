import { useEffect, useRef } from 'react'
import { copyToClipboard } from '../lib/clipboard'

// navigator.clipboard.writeText can fail — or succeed — without any visible
// signal either way, so a "Copy" button alone gives no reliable feedback
// that anything happened. A plain <textarea> needs no special API or
// permission at all: the user can always see the content and select +
// Cmd/Ctrl+C it themselves. That's the guaranteed path; the "Copy" button
// is just a one-click shortcut on top of it.
export default function CopyableMessageBox({ text }: { text: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  return (
    <div className="mt-1 flex flex-col gap-1">
      <textarea
        ref={ref}
        readOnly
        value={text}
        rows={8}
        onClick={(e) => e.currentTarget.select()}
        className="w-full rounded-md border border-sand-200 bg-white p-2 font-mono text-xs text-ink-900"
      />
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => copyToClipboard(text)} className="text-xs text-ink-800 underline">
          Copy
        </button>
        <span className="text-xs text-slate-400">or click the text above to select it, then Cmd/Ctrl+C</span>
      </div>
    </div>
  )
}
