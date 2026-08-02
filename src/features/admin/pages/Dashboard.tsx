import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../lib/auth'
import { can } from '../../../types/permissions'
import { listRegistrations } from '../../../lib/firestore/registrations'
import { getDefaultSymposium } from '../../../lib/firestore/symposia'
import { listSpeakers } from '../../../lib/firestore/speakers'
import { listAllPartners } from '../../../lib/firestore/partnerProfiles'
import { listAbstractSubmissions } from '../../../lib/firestore/abstractSubmissions'
import ChangePasswordCard from '../../../components/ChangePasswordCard'
import type { AbstractSubmission, Registration, Symposium } from '../../../types/models'

function StatTile({ label, value, to }: { label: string; value: string | number; to?: string }) {
  const content = (
    <div className="rounded-lg border border-sand-200 bg-white p-5">
      <p className="text-3xl text-ink-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  )
  return to ? (
    <Link to={to} className="block transition-shadow hover:shadow-md">
      {content}
    </Link>
  ) : (
    content
  )
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [symposium, setSymposium] = useState<Symposium | null>(null)
  const [registrations, setRegistrations] = useState<Registration[] | null>(null)
  const [abstracts, setAbstracts] = useState<AbstractSubmission[] | null>(null)
  const [pendingSpeakers, setPendingSpeakers] = useState(0)
  const [pendingPartners, setPendingPartners] = useState(0)
  const [loading, setLoading] = useState(true)

  const canSeeRegistrations = can(profile?.systemRole ?? null, 'registrations')

  useEffect(() => {
    async function load() {
      const [sym, speakers, partners] = await Promise.all([
        getDefaultSymposium(),
        listSpeakers(),
        listAllPartners(),
      ])
      setSymposium(sym)
      setPendingSpeakers(speakers.filter((s) => !s.visible && s.userId).length)
      setPendingPartners(partners.filter((p) => !p.visible && p.userId).length)

      if (canSeeRegistrations) {
        const [regs, abs] = await Promise.all([listRegistrations(), listAbstractSubmissions()])
        setRegistrations(regs)
        setAbstracts(abs)
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pendingApproval = registrations?.filter((r) => r.status === 'pending_approval').length ?? 0
  const approved = registrations?.filter((r) => r.status === 'approved').length ?? 0
  const invitedInPerson = registrations?.filter((r) => r.participationRole === 'invited_participant').length ?? 0
  const pendingAbstracts = abstracts?.filter((a) => a.status === 'pending').length ?? 0

  const physicalConfirmed = symposium?.confirmedPhysicalCount ?? 0
  const physicalMax = symposium?.maxPhysicalAttendees
  const onlineConfirmed = symposium?.confirmedOnlineCount ?? 0
  const onlineMax = symposium?.onlineCapacityMode === 'fixed' ? symposium?.maxOnlineAttendees : undefined

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="text-3xl">Dashboard</h1>
      <p className="mt-2 text-sm text-slate-500">
        {symposium ? symposium.name : 'No symposium configured yet.'}
      </p>

      {loading && <p className="mt-6 text-slate-400">Loading…</p>}

      {!loading && canSeeRegistrations && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Pending approval" value={pendingApproval} to="/admin/registrations" />
            <StatTile label="Approved registrations" value={approved} to="/admin/registrations" />
            <StatTile
              label="Physical attendance"
              value={physicalMax != null ? `${physicalConfirmed} / ${physicalMax}` : physicalConfirmed}
              to="/admin/registrations"
            />
            <StatTile
              label="Online attendance"
              value={onlineMax != null ? `${onlineConfirmed} / ${onlineMax}` : onlineConfirmed}
              to="/admin/registrations"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Invited in person" value={invitedInPerson} to="/admin/registrations" />
            <StatTile label="Pending abstracts" value={pendingAbstracts} to="/admin/abstracts" />
            <StatTile label="Speaker profiles to review" value={pendingSpeakers} to="/admin/speakers" />
            <StatTile label="Partner profiles to review" value={pendingPartners} to="/admin/partners" />
          </div>
        </>
      )}

      {!loading && !canSeeRegistrations && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Speaker profiles to review" value={pendingSpeakers} to="/admin/speakers" />
          <StatTile label="Partner profiles to review" value={pendingPartners} to="/admin/partners" />
        </div>
      )}

      <div className="mt-8 max-w-md">
        <ChangePasswordCard />
      </div>
    </div>
  )
}
