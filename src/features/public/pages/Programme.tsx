import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroBlock from '../../../components/cms/HeroBlock'
import RichText from '../../../components/RichText'
import { usePageHero } from '../cms/usePageHero'
import { listSessions } from '../../../lib/firestore/sessions'
import { listVisibleSpeakers } from '../../../lib/firestore/speakers'
import type { Session, Speaker } from '../../../types/models'

function groupByDay(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>()
  for (const session of sessions) {
    const list = map.get(session.day) ?? []
    list.push(session)
    map.set(session.day, list)
  }
  return map
}

export default function Programme() {
  const { hero, loading: heroLoading } = usePageHero('programme')
  const [sessions, setSessions] = useState<Session[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listSessions(), listVisibleSpeakers()]).then(([s, sp]) => {
      setSessions(s)
      setSpeakers(sp)
      setLoading(false)
    })
  }, [])

  if (heroLoading || loading) return null

  const days = groupByDay(sessions)

  return (
    <div>
      <HeroBlock hero={hero} />
      <div className="mx-auto max-w-4xl px-6 py-16">
        {days.size === 0 && (
          <p className="text-slate-500">The programme hasn't been published yet — check back soon.</p>
        )}
        {[...days.entries()].map(([day, daySessions]) => (
          <div key={day} className="mb-12">
            <h2 className="text-2xl">
              {new Date(day).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            <div className="mt-4 flex flex-col divide-y divide-sand-200 rounded-lg border border-sand-200 bg-white">
              {daySessions.map((session) => {
                const sessionSpeakers = speakers.filter((sp) => sp.sessionId === session.id)
                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <p className="w-32 shrink-0 text-sm text-gold-600">
                      {new Date(session.startTime).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' – '}
                      {new Date(session.endTime).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <div>
                      <p className="text-ink-900">{session.title}</p>
                      {session.description && (
                        <p className="mt-1 text-sm text-slate-500">
                          <RichText text={session.description} />
                        </p>
                      )}
                      {session.roomOrTrack && <p className="mt-1 text-xs text-slate-400">{session.roomOrTrack}</p>}
                      {sessionSpeakers.length > 0 && (
                        <p className="mt-1 text-sm">
                          {sessionSpeakers.map((sp, i) => (
                            <span key={sp.id}>
                              {i > 0 && ', '}
                              <Link to={`/symposium/speakers/${sp.id}`} className="text-gold-600 underline">
                                {sp.name}
                              </Link>
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
