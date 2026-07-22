export default function Footer() {
  return (
    <footer className="border-t border-sand-200 bg-ink-950 text-sand-100">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm">
        <p className="font-display text-lg text-sand-50">GERS Symposium</p>
        <p className="mt-2 max-w-md text-slate-300">
          GDEnv, University of Johannesburg.
        </p>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-wide text-slate-400">In partnership with</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="rounded-md bg-sand-50 px-4 py-3">
              <img src="/GDEnv-logo.png" alt="Gauteng Department of Environment" className="h-8 w-auto" />
            </div>
            <div className="rounded-md bg-sand-50 px-4 py-3">
              <img src="/peets-logo.png" alt="UJ PEETS" className="h-8 w-auto" />
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          © {new Date().getFullYear()} GERS. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
