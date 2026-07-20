interface PagePlaceholderProps {
  title: string
  phase: string
  note?: string
}

// Temporary stand-in used while each area is scaffolded phase by phase —
// gets replaced as each phase in the build plan lands.
export default function PagePlaceholder({ title, phase, note }: PagePlaceholderProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <p className="text-sm uppercase tracking-wide text-ochre-600">{phase}</p>
      <h1 className="mt-2 text-4xl">{title}</h1>
      {note && <p className="mt-4 max-w-xl text-slate-500">{note}</p>}
    </div>
  )
}
