import { BrowserRouter, Routes, Route } from 'react-router-dom'

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
import PastSymposiums from './features/public/pages/PastSymposiums'
import Faq from './features/public/pages/Faq'
import RegisterIntro from './features/public/pages/RegisterIntro'
import AccountHome from './features/account/pages/AccountHome'
import Login from './features/auth/pages/Login'
import Signup from './features/auth/pages/Signup'
import ItemDetailPage from './features/public/cms/ItemDetailPage'

import AdminDashboard from './features/admin/pages/Dashboard'
import AdminContent from './features/admin/pages/Content'
import PageEditor from './features/admin/cms/PageEditor'
import AdminProgramme from './features/admin/pages/Programme'
import AdminSpeakers from './features/admin/pages/Speakers'
import AdminRegistrations from './features/admin/pages/Registrations'
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
            <Route path="event-overview" element={<EventOverview />} />
            <Route path="programme" element={<Programme />} />
            <Route path="speakers" element={<Speakers />} />
            <Route path="exhibition" element={<Exhibition />} />
            <Route path="student-track" element={<StudentTrack />} />
            <Route path="past-symposiums" element={<PastSymposiums />} />
            <Route path="faq" element={<Faq />} />
            <Route path="register" element={<RegisterIntro />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="i/:slug" element={<ItemDetailPage />} />

            <Route element={<RequireAuth />}>
              <Route path="account" element={<AccountHome />} />
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
              <Route path="registrations" element={<AdminRegistrations />} />
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
