import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

// Public pages and the logged-in attendee account area share this one shell —
// see GERS_Functional_Requirements.docx §12: the "My Account" entry point
// reveals attendee pages without swapping visitors into a different-looking system.
export default function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-sand-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
