import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './lib/auth'
import PublicLayout from './routes/PublicLayout'
import AdminLayout from './routes/AdminLayout'
import RequireAuth from './routes/RequireAuth'
import RequireRole from './routes/RequireRole'

import Home from './features/public/pages/Home'
import About from './features/public/pages/About'
import EventOverview from './features/public/pages/EventOverview'
import Programme from './features/public/pages/Programme'
import Speakers from './features/public/pages/Speakers'
import Exhibition from './features/public/pages/Exhibition'
import StudentTrack from './features/public/pages/StudentTrack'
import Partners from './features/public/pages/Partners'
import PastSymposiums from './features/public/pages/PastSymposiums'
import Faq from './features/public/pages/Faq'
import RegisterIntro from './features/public/pages/RegisterIntro'
import AccountHome from './features/account/pages/AccountHome'
import RegisterFlow from './features/account/pages/RegisterFlow'
import AbstractSubmissionForm from './features/account/pages/AbstractSubmissionForm'
import InviteComplete from './features/account/pages/InviteComplete'
import Login from './features/auth/pages/Login'
import ItemDetailPage from './features/public/cms/ItemDetailPage'

import AdminDashboard from './features/admin/pages/Dashboard'
import AdminContent from './features/admin/pages/Content'
import PageEditor from './features/admin/cms/PageEditor'
import AdminProgramme from './features/admin/pages/Programme'
import AdminSpeakers from './features/admin/pages/Speakers'
import AdminPartners from './features/admin/pages/Partners'
import AdminRegistrations from './features/admin/pages/Registrations'
import AdminAbstracts from './features/admin/pages/Abstracts'
import AdminPrompts from './features/admin/pages/Prompts'
import AdminExport from './features/admin/pages/Export'
import AdminAccounts from './features/admin/pages/Accounts'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="symposium" element={<EventOverview />} />
            <Route path="symposium/programme" element={<Programme />} />
            <Route path="symposium/speakers" element={<Speakers />} />
            <Route path="symposium/exhibition" element={<Exhibition />} />
            <Route path="symposium/student-track" element={<StudentTrack />} />
            <Route path="partners" element={<Partners />} />
            <Route path="past-symposiums" element={<PastSymposiums />} />
            <Route path="faq" element={<Faq />} />
            <Route path="register" element={<RegisterIntro />} />
            <Route path="register/apply" element={<RegisterFlow />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Navigate to="/register/apply" replace />} />
            <Route path="invite/complete" element={<InviteComplete />} />
            {/* Old top-level paths from before the nav restructure — kept as
                redirects since CMS-authored links (e.g. Home page cards) may
                still point at them. */}
            <Route path="event-overview" element={<Navigate to="/symposium" replace />} />
            <Route path="programme" element={<Navigate to="/symposium/programme" replace />} />
            <Route path="speakers" element={<Navigate to="/symposium/speakers" replace />} />
            <Route path="exhibition" element={<Navigate to="/symposium/exhibition" replace />} />
            <Route path="student-track" element={<Navigate to="/symposium/student-track" replace />} />
            <Route path="i/:slug" element={<ItemDetailPage />} />

            <Route element={<RequireAuth />}>
              <Route path="account" element={<AccountHome />} />
              <Route path="register/abstract" element={<AbstractSubmissionForm />} />
            </Route>
          </Route>

          <Route path="admin" element={<RequireRole />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route element={<RequireRole capability="cms" />}>
                <Route path="content" element={<AdminContent />} />
                <Route path="content/:pageId" element={<PageEditor />} />
              </Route>
              <Route element={<RequireRole capability="registrations" />}>
                <Route path="programme" element={<AdminProgramme />} />
              </Route>
              <Route path="speakers" element={<AdminSpeakers />} />
              <Route path="partners" element={<AdminPartners />} />
              <Route element={<RequireRole capability="registrations" />}>
                <Route path="registrations" element={<AdminRegistrations />} />
                <Route path="abstracts" element={<AdminAbstracts />} />
              </Route>
              <Route path="prompts" element={<AdminPrompts />} />
              <Route path="export" element={<AdminExport />} />
              <Route path="accounts" element={<AdminAccounts />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
