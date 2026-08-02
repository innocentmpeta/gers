import CmsPage from '../cms/CmsPage'
import SymposiumSubNav from '../../../components/SymposiumSubNav'

export default function EventOverview() {
  return <CmsPage slug="event-overview" afterHero={<SymposiumSubNav />} />
}
