export default function Footer() {
  return (
    <footer className="border-t border-sand-200 bg-teal-950 text-sand-100">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm">
        <p className="font-display text-lg text-sand-50">GERS Symposium</p>
        <p className="mt-2 max-w-md text-slate-300">
          GDEnv, University of Johannesburg.
        </p>
        <p className="mt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} GERS. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
