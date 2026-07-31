import { Link } from 'react-router-dom'
import { useAuth } from '../../../lib/auth'
import CmsPage from '../cms/CmsPage'

// The admin-editable CMS content above is optional framing — the CTAs below
// are the actual functional entry point into registration and must always
// render, even before anyone's added CMS content for this page (or that
// content only covers messaging, never the account/registration flow).
export default function RegisterIntro() {
  const { firebaseUser } = useAuth()

  return (
    <div>
      <CmsPage slug="register" />
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="text-2xl">Ready to register?</h2>
        <p className="mt-2 text-slate-500">
          {firebaseUser
            ? "You're signed in — head straight to the registration form."
            : 'Create a free account first, then register for the symposium.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to={firebaseUser ? '/register/apply' : '/signup'}
            className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600"
          >
            {firebaseUser ? 'Register now' : 'Create account to register'}
          </Link>
          <Link
            to={firebaseUser ? '/register/abstract' : '/signup'}
            className="rounded-full border border-ink-800 px-5 py-2.5 text-sm font-medium text-ink-800 hover:bg-ink-800 hover:text-sand-50"
          >
            Submit an abstract instead
          </Link>
        </div>
        {!firebaseUser && (
          <p className="mt-4 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-ink-800 underline">
              Log in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
