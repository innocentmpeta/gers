import { useEffect, useState } from 'react'
import MediaPicker from '../../../components/cms/MediaPicker'
import { getHomeContent, saveHomeContent } from '../../../lib/firestore/homeContent'
import type { HomeExploreCard, MediaAsset } from '../../../types/models'

const EXPLORE_CARD_COUNT = 4

function emptyCard(): HomeExploreCard {
  return { title: '', body: '', imageId: undefined, link: '' }
}

export default function HomeContentEditor({ pageId }: { pageId: string }) {
  const [introHeading, setIntroHeading] = useState('')
  const [introBody, setIntroBody] = useState('')
  const [introImageId, setIntroImageId] = useState<string | undefined>()
  const [introImage, setIntroImage] = useState<MediaAsset | null>(null)

  const [cards, setCards] = useState<HomeExploreCard[]>(
    Array.from({ length: EXPLORE_CARD_COUNT }, emptyCard)
  )
  const [cardImages, setCardImages] = useState<Record<number, MediaAsset | null>>({})

  const [ctaHeading, setCtaHeading] = useState('')
  const [ctaSubtext, setCtaSubtext] = useState('')
  const [ctaButtonLabel, setCtaButtonLabel] = useState('')
  const [ctaButtonLink, setCtaButtonLink] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    getHomeContent(pageId).then((content) => {
      if (content) {
        setIntroHeading(content.introHeading ?? '')
        setIntroBody(content.introBody ?? '')
        setIntroImageId(content.introImageId)
        const padded = [...content.exploreCards]
        while (padded.length < EXPLORE_CARD_COUNT) padded.push(emptyCard())
        setCards(padded.slice(0, EXPLORE_CARD_COUNT))
        setCtaHeading(content.ctaHeading ?? '')
        setCtaSubtext(content.ctaSubtext ?? '')
        setCtaButtonLabel(content.ctaButtonLabel ?? '')
        setCtaButtonLink(content.ctaButtonLink ?? '')
      }
      setLoading(false)
    })
  }, [pageId])

  function updateCard(index: number, patch: Partial<HomeExploreCard>) {
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      await saveHomeContent(pageId, {
        introHeading: introHeading || undefined,
        introBody: introBody || undefined,
        introImageId: introImage?.id ?? introImageId,
        exploreCards: cards.map((c, i) => ({
          ...c,
          imageId: cardImages[i]?.id ?? c.imageId,
        })),
        ctaHeading: ctaHeading || undefined,
        ctaSubtext: ctaSubtext || undefined,
        ctaButtonLabel: ctaButtonLabel || undefined,
        ctaButtonLink: ctaButtonLink || undefined,
      })
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="mt-8 text-slate-400">Loading…</p>

  return (
    <div className="mt-8 flex flex-col gap-8">
      <p className="text-sm text-slate-500">
        Home's structure is fixed — Intro, Explore cards, and the closing banner always appear in
        this shape. You can edit the content of each block below, but not add, remove, or
        reorder them. Other pages keep the flexible section editor.
      </p>

      <section className="rounded-lg border border-sand-200 bg-white p-5">
        <h2 className="text-xl">Intro</h2>
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Heading
            <input
              value={introHeading}
              onChange={(e) => setIntroHeading(e.target.value)}
              className="rounded-md border border-sand-200 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Body
            <textarea
              value={introBody}
              onChange={(e) => setIntroBody(e.target.value)}
              rows={3}
              className="rounded-md border border-sand-200 px-3 py-2"
            />
          </label>
          <MediaPicker
            label="Image"
            accept="image"
            selectedAssetId={introImage?.id ?? introImageId}
            onSelect={setIntroImage}
          />
        </div>
      </section>

      <section className="rounded-lg border border-sand-200 bg-white p-5">
        <h2 className="text-xl">Explore ({EXPLORE_CARD_COUNT} cards)</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((card, i) => (
            <div key={i} className="rounded-md border border-sand-100 p-4">
              <p className="text-sm font-medium text-ochre-600">Card {i + 1}</p>
              <div className="mt-2 flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  Title
                  <input
                    value={card.title}
                    onChange={(e) => updateCard(i, { title: e.target.value })}
                    className="rounded-md border border-sand-200 px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  Body
                  <textarea
                    value={card.body}
                    onChange={(e) => updateCard(i, { body: e.target.value })}
                    rows={2}
                    className="rounded-md border border-sand-200 px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  Link (e.g. /programme, or a full https:// URL)
                  <input
                    value={card.link}
                    onChange={(e) => updateCard(i, { link: e.target.value })}
                    className="rounded-md border border-sand-200 px-3 py-2"
                  />
                </label>
                <MediaPicker
                  label="Image"
                  accept="image"
                  selectedAssetId={cardImages[i]?.id ?? card.imageId}
                  onSelect={(asset) => setCardImages((prev) => ({ ...prev, [i]: asset }))}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-sand-200 bg-white p-5">
        <h2 className="text-xl">Closing banner</h2>
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Heading
            <input
              value={ctaHeading}
              onChange={(e) => setCtaHeading(e.target.value)}
              className="rounded-md border border-sand-200 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Subtext
            <input
              value={ctaSubtext}
              onChange={(e) => setCtaSubtext(e.target.value)}
              className="rounded-md border border-sand-200 px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Button label
              <input
                value={ctaButtonLabel}
                onChange={(e) => setCtaButtonLabel(e.target.value)}
                className="rounded-md border border-sand-200 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Button link
              <input
                value={ctaButtonLink}
                onChange={(e) => setCtaButtonLink(e.target.value)}
                className="rounded-md border border-sand-200 px-3 py-2"
              />
            </label>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start rounded-full bg-teal-800 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-teal-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save home content'}
        </button>
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      </div>
    </div>
  )
}
