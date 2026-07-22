import { useEffect, useState } from 'react'
import HeroBlock from '../../../components/cms/HeroBlock'
import { usePageHero } from '../cms/usePageHero'
import { listFaqItems } from '../../../lib/firestore/faqItems'
import type { FaqItem } from '../../../types/models'

export default function Faq() {
  const { hero, loading: heroLoading } = usePageHero('faq')
  const [items, setItems] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listFaqItems().then((list) => {
      setItems(list)
      setLoading(false)
    })
  }, [])

  if (heroLoading || loading) return null

  return (
    <div>
      <HeroBlock hero={hero} />
      <div className="mx-auto max-w-3xl px-6 py-16">
        {items.length === 0 ? (
          <p className="text-slate-500">Frequently asked questions will appear here soon.</p>
        ) : (
          <div className="flex flex-col divide-y divide-sand-200 rounded-lg border border-sand-200 bg-white">
            {items.map((item) => (
              <details key={item.id} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-ink-900">
                  {item.question}
                  <span className="ml-4 text-gold-600 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
