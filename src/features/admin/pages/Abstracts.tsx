import { useEffect, useState } from 'react'
import { useAuth } from '../../../lib/auth'
import { listAbstractSubmissions, decideAbstract } from '../../../lib/firestore/abstractSubmissions'
import { listUsersByIds } from '../../../lib/firestore/users'
import type { AbstractSubmission, User } from '../../../types/models'

type StatusFilter = 'all' | AbstractSubmission['status']

const STATUS_LABEL: Record<AbstractSubmission['status'], string> = {
  pending: 'Pending review',
  accepted: 'Accepted',
  declined: 'Declined',
}

const STATUS_COLOR: Record<AbstractSubmission['status'], string> = {
  pending: 'text-gold-600',
  accepted: 'text-green-600',
  declined: 'text-red-600',
}

export default function AdminAbstracts() {
  const { firebaseUser } = useAuth()
  const [submissions, setSubmissions] = useState<AbstractSubmission[]>([])
  const [users, setUsers] = useState<Map<string, User>>(new Map())
  const [filter, setFilter] = useState<StatusFilter>('pending')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const subs = await listAbstractSubmissions()
    setSubmissions(subs)
    setUsers(await listUsersByIds(subs.map((s) => s.userId)))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDecide(id: string, status: 'accepted' | 'declined') {
    if (!firebaseUser) return
    await decideAbstract(id, status, firebaseUser.uid)
    load()
  }

  const query = search.trim().toLowerCase()
  const visible = submissions.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false
    if (!query) return true
    const user = users.get(s.userId)
    const haystack = [s.title, s.track, user?.name, user?.surname, user?.email, s.affiliation]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-8 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="text-3xl">Abstract submissions</h1>
      <p className="mt-2 text-sm text-slate-500">
        Accept or decline submissions. Accepted applicants are invited to complete registration
        with their role pre-set to Presenter.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2 text-sm">
          {(['pending', 'accepted', 'declined', 'all'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 ${
                filter === f ? 'bg-ink-900 text-sand-50' : 'bg-sand-100 text-slate-700 hover:bg-sand-200'
              }`}
            >
              {f === 'all' ? 'All' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, track, or submitter…"
          className="ml-auto min-w-[240px] rounded-full border border-sand-200 px-4 py-1.5 text-sm"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {visible.length === 0 && <p className="text-sm text-slate-500">No submissions here.</p>}

        {visible.map((s) => {
          const user = users.get(s.userId)
          return (
            <div key={s.id} className="rounded-lg border border-sand-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-ink-900">{s.title}</p>
                  <p className="text-sm text-slate-500">
                    {user?.name ?? 'Unknown user'} · {user?.email}
                    {s.affiliation && <> · {s.affiliation}</>}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">Track: {s.track}</p>
                  <p className={`mt-1 text-sm font-medium ${STATUS_COLOR[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </p>
                </div>
                {s.status === 'pending' && (
                  <div className="flex shrink-0 gap-3 text-sm">
                    <button onClick={() => handleDecide(s.id, 'accepted')} className="text-green-600 underline">
                      Accept
                    </button>
                    <button onClick={() => handleDecide(s.id, 'declined')} className="text-red-600 underline">
                      Decline
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{s.abstractText}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
