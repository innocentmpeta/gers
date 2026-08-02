import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSignInWithEmailLink, signInWithEmailLink, signOut, updateProfile } from 'firebase/auth'
import { auth } from '../../../lib/firebase'
import { getPendingInviteByEmail, markInviteConsumed } from '../../../lib/firestore/invites'
import { newUserProfile, createUserProfile, grantSystemRoleFromInvite } from '../../../lib/firestore/users'
import { completeInviteRegistration } from '../../../lib/firestore/registrations'
import { getDefaultSymposium } from '../../../lib/firestore/symposia'

type Status = 'checking' | 'need-email' | 'working' | 'error'

function mapError(err: unknown): string {
  const code = (err as { code?: string })?.code
  if (code === 'auth/invalid-action-code') {
    return 'This invite link has expired or was already used. Ask the organisers to send a new one.'
  }
  if (code === 'auth/invalid-email') {
    return "That doesn't look like a valid email address."
  }
  return 'Something went wrong completing your invite. Please try again or contact the organisers.'
}

// Landing page for the passwordless invite link organisers send from
// Admin > Accounts & Roles. Firebase's own sign-in-with-link flow creates the
// Auth account on first use; this page then looks up the matching pending
// Invite (by email) to fill in the User profile and Registration that a
// self-service sign-up would otherwise have collected via a form.
export default function InviteComplete() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('checking')
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function complete(emailToUse: string) {
    setStatus('working')
    try {
      const cred = await signInWithEmailLink(auth, emailToUse, window.location.href)
      await cred.user.getIdToken(true)

      const invite = await getPendingInviteByEmail(emailToUse)
      if (!invite) {
        await signOut(auth)
        setErrorMessage(
          "We couldn't find a pending invite for this email. If you've already completed it, log in normally instead."
        )
        setStatus('error')
        return
      }

      await updateProfile(cred.user, { displayName: `${invite.name} ${invite.surname}` })
      await createUserProfile(
        newUserProfile(cred.user.uid, {
          name: invite.name,
          surname: invite.surname,
          email: invite.email,
          salutation: invite.salutation,
          organization: invite.organization,
          jobTitle: invite.jobTitle,
          sector: invite.sector,
          gender: invite.gender,
          ageGroup: invite.ageGroup,
          whatsappNumber: invite.whatsappNumber,
        })
      )

      if (invite.systemRole) {
        await grantSystemRoleFromInvite(cred.user.uid, invite.systemRole, invite.id)
      }

      if (invite.registerAsAttendee && invite.participationRole && invite.attendanceMode) {
        const symposium = await getDefaultSymposium()
        if (symposium) {
          await completeInviteRegistration(cred.user.uid, symposium.id, {
            ...invite,
            participationRole: invite.participationRole,
            attendanceMode: invite.attendanceMode,
          })
        }
      }
      await markInviteConsumed(invite.id)

      navigate('/account')
    } catch (err) {
      setErrorMessage(mapError(err))
      setStatus('error')
    }
  }

  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setErrorMessage("This isn't a valid invite link.")
      setStatus('error')
      return
    }
    const fromUrl = new URLSearchParams(window.location.search).get('email')
    if (fromUrl) {
      complete(fromUrl)
    } else {
      setStatus('need-email')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-gold-600">Accepting your invite</p>

      {status === 'checking' && <p className="mt-4 text-slate-500">Checking your invite link…</p>}
      {status === 'working' && <p className="mt-4 text-slate-500">Setting up your account…</p>}

      {status === 'need-email' && (
        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            complete(email)
          }}
        >
          <p className="text-sm text-slate-600">
            Confirm the email address this invite was sent to.
          </p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-sand-200 px-3 py-2"
            placeholder="you@example.com"
          />
          <button
            type="submit"
            className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600"
          >
            Continue
          </button>
        </form>
      )}

      {status === 'error' && <p className="mt-4 text-red-600">{errorMessage}</p>}
    </div>
  )
}
