import { Link } from 'react-router-dom'
import CmsPage from '../cms/CmsPage'

// The admin-editable CMS content above is optional framing — the CTAs below
// are the actual functional entry point into registration and must always
// render, even before anyone's added CMS content for this page (or that
// content only covers messaging, never the account/registration flow).
// /register/apply handles both signed-out (bundled sign-up + registration)
// and signed-in (one-click registration) cases itself, so this page doesn't
// need to branch on auth state anymore.
export default function RegisterIntro() {
  return (
    <div>
      <CmsPage slug="register" />
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="text-2xl">Ready to register?</h2>
        <p className="mt-2 text-slate-500">
          Registering creates your account (if you don't have one yet) and signs you up as an
          online participant, pending approval.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/register/apply"
            className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600"
          >
            Register now
          </Link>
          <Link
            to="/register/abstract"
            className="rounded-full border border-ink-800 px-5 py-2.5 text-sm font-medium text-ink-800 hover:bg-ink-800 hover:text-sand-50"
          >
            Submit an abstract instead
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-ink-800 underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
