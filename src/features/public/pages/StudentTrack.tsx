import CmsPage from '../cms/CmsPage'
import SymposiumSubNav from '../../../components/SymposiumSubNav'

export default function StudentTrack() {
  return <CmsPage slug="student-track" afterHero={<SymposiumSubNav />} />
}
