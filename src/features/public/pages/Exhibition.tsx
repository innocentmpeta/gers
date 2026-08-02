import CmsPage from '../cms/CmsPage'
import SymposiumSubNav from '../../../components/SymposiumSubNav'

export default function Exhibition() {
  return <CmsPage slug="exhibition" afterHero={<SymposiumSubNav />} />
}
